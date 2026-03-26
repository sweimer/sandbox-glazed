// DXPR AI Optimizer - HTML optimization for AI token reduction
// Based on minify-html v0.16.4 by Wilson Lin (MIT License)
// https://github.com/wilsonzlin/minify-html

#![deny(unsafe_code)]

use crate::ast::c14n::c14n_serialise_ast;
pub use crate::cfg::Cfg;
use crate::minify::content::minify_content;
use crate::parse::content::parse_content;
use crate::parse::Code;
use minify_html_common::spec::tag::ns::Namespace;
use minify_html_common::spec::tag::EMPTY_SLICE;
use parse::ParseOpts;
use std::io::Write;

mod ast;
mod cfg;
mod entity;
mod minify;
mod parse;
mod tag;
#[cfg(test)]
mod tests;

// WASM-specific imports and functions
#[cfg(target_arch = "wasm32")]
use js_sys::Reflect;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(all(target_arch = "wasm32", feature = "console_error_panic_hook"))]
#[wasm_bindgen(start)]
pub fn wasm_init() {
    console_error_panic_hook::set_once();
}

// Macro to extract boolean properties from JS config object
#[cfg(target_arch = "wasm32")]
macro_rules! get_prop {
    ($cfg:expr, $x:literal) => {
        Reflect::get($cfg, &JsValue::from_str($x))
            .ok()
            .and_then(|p| p.as_bool())
            .unwrap_or(false)
    };
}

/// Minify HTML for WASM/JavaScript usage
/// This is the WASM entry point that wraps the main minify function
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn minify(code: &[u8], cfg_js: &JsValue) -> Vec<u8> {
    #[rustfmt::skip]
  let cfg = Cfg {
    allow_noncompliant_unquoted_attribute_values: get_prop!(cfg_js, "allow_noncompliant_unquoted_attribute_values"),
    allow_optimal_entities: get_prop!(cfg_js, "allow_optimal_entities"),
    allow_removing_spaces_between_attributes: get_prop!(cfg_js, "allow_removing_spaces_between_attributes"),
    keep_closing_tags: get_prop!(cfg_js, "keep_closing_tags"),
    keep_comments: get_prop!(cfg_js, "keep_comments"),
    keep_html_and_head_opening_tags: get_prop!(cfg_js, "keep_html_and_head_opening_tags"),
    keep_input_type_text_attr: get_prop!(cfg_js, "keep_input_type_text_attr"),
    keep_ssi_comments: get_prop!(cfg_js, "keep_ssi_comments"),
    minify_css: get_prop!(cfg_js, "minify_css"),
    minify_doctype: get_prop!(cfg_js, "minify_doctype"),
    minify_js: get_prop!(cfg_js, "minify_js"),
    preserve_brace_template_syntax: get_prop!(cfg_js, "preserve_brace_template_syntax"),
    preserve_chevron_percent_template_syntax: get_prop!(cfg_js, "preserve_chevron_percent_template_syntax"),
    remove_bangs: get_prop!(cfg_js, "remove_bangs"),
    remove_processing_instructions: get_prop!(cfg_js, "remove_processing_instructions"),
  };
    minify_html(code, &cfg)
}

/// Minifies UTF-8 HTML code, represented as an array of bytes.
///
/// This is the main minification function that can be used from Rust or WASM.
///
/// # Arguments
///
/// * `src` - A slice of bytes representing the source code to minify.
/// * `cfg` - Configuration object to adjust minification approach.
///
/// # Examples
///
/// ```
/// use dxpr_ai_optimizer::{Cfg, minify_html};
///
/// let code: &[u8] = b"<p>  Hello, world!  </p>";
/// let mut cfg = Cfg::default();
/// cfg.keep_closing_tags = true;
/// let minified = minify_html(&code, &cfg);
/// assert_eq!(minified, b"<p>Hello, world!</p>".to_vec());
/// ```
pub fn minify_html(src: &[u8], cfg: &Cfg) -> Vec<u8> {
    let mut code = Code::new_with_opts(
        src,
        ParseOpts {
            treat_brace_as_opaque: cfg.preserve_brace_template_syntax,
            treat_chevron_percent_as_opaque: cfg.preserve_chevron_percent_template_syntax,
        },
    );
    let parsed = parse_content(&mut code, Namespace::Html, EMPTY_SLICE, EMPTY_SLICE);
    let mut out = Vec::with_capacity(src.len());
    minify_content(
        cfg,
        &mut out,
        Namespace::Html,
        false,
        EMPTY_SLICE,
        parsed.children,
    );
    out.shrink_to_fit();
    out
}

pub fn canonicalise<T: Write>(out: &mut T, src: &[u8]) -> std::io::Result<()> {
    let mut code = Code::new(src);
    let parsed = parse_content(&mut code, Namespace::Html, EMPTY_SLICE, EMPTY_SLICE);
    for c in parsed.children {
        c14n_serialise_ast(out, &c)?;
    }
    Ok(())
}
