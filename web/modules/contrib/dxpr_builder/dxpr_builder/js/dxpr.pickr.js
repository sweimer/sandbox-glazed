!function(t) {
    var i = '<div tabindex="0" class="wp-color-result" />',

        r = '<div class="wp-picker-holder" />',
        n = '<div class="wp-picker-container" />',
        l = '<input type="button" class="button button-small hidden" />';
    const clearColor = '#ffffff';
    var o = {
        options: {
            defaultColor: false,
            change: false,
            clear: false,
            hide: true,
            palettes: true
        },
        _create: function() {
            var a = this,
                s = a.element;

            t.extend(a.options, s.data());
            a.initialValue = s.val();
            s.addClass("wp-color-picker").hide().wrap(n);
            a.wrap = s.parent();
            a.toggler = t(i).insertBefore(s).attr("title", wpColorPickerL10n.pick);
            a.pickerContainer = t(r).insertAfter(s);
            a.button = t(l); // "Clear" button
            a.options.defaultColor ? a.button.addClass("wp-picker-default").val(wpColorPickerL10n.defaultString) : a.button.addClass("wp-picker-clear").val(wpColorPickerL10n.clear);
            s.wrap('<span class="wp-picker-input-wrap hidden" />').after(a.button);

            s.css("display", "block");
            const div = document.createElement('div');
            a.toggler[0].appendChild(div);

            const colorResultToggler = this.toggler[0];
            const parent = colorResultToggler.parentNode;
            const wrapper = document.createElement('div');
            wrapper.className = 'color-result-wrapper';
            // set the wrapper as child (instead of the `colorResultToggler`)
            parent.replaceChild(wrapper, colorResultToggler);
            // set `colorResultToggler` as child of wrapper
            wrapper.appendChild(colorResultToggler);
            this.wrapper = $(wrapper);
            // Palette provided by Drupal Color module or DXPR Theme 6+
            const palette = drupalSettings?.dxprBuilder?.palette ?? null;
            
            a.pickr = Pickr.create({
                el: a.toggler[0].firstElementChild,
                theme: 'classic', // or 'monolith', or 'nano'
                swatches: palette,
                comparison: false,
                showAlways: true,
                default: a.initialValue || '#f2f4fa',
                inline: true,
                components: {
                    preview: false,
                    opacity: true,
                    hue: true,
                    interaction: {
                        hex: false,
                        rgba: false,
                        hsla: false,
                        hsva: false,
                        cmyk: false,
                        input: true,
                        clear: false,
                        save: false
                    }
                }
            });

            a.pickr.on('change', (color, instance) => {
                // Ignore a change event that was triggered by the input element
                if (this._ignoreChange) {
                    this._ignoreChange = false;
                    return;
                }
                var color;
                if (color.a === 1) {
                    color = color.toHEXA().toString();
                } else {
                    var rgba = color.toRGBA();
    
                    var roundedR = Number(rgba[0].toFixed(0));
                    var roundedG = Number(rgba[1].toFixed(0));
                    var roundedB = Number(rgba[2].toFixed(0));
                    var roundedA = Number(rgba[3].toFixed(2));
    
                    color = `rgba(${roundedR}, ${roundedG}, ${roundedB}, ${roundedA})`;
                }
                s.val(color);
                if (typeof a.options.change === 'function') {
                    a.options.change.call(this, {color: color}, o);
                }
            });

            s.val(a.initialValue);

            a.pickr.on('init', pickr => {
                this.shown = false;
                pickr.hide();
                a._addListeners();
                if (!a.options.hide) {
                    a.toggler.click();
                }
                // move pickr .pcr-app to wp-picker-holder
                const pcrApp = a.toggler.find('.pcr-app');
                a.pickerContainer[0].appendChild(pcrApp[0]);
                a.pickerContainer.toggleClass('hidden');
            });
        },
        _addListeners: function() {
            var e = this;
            e.toggler.click((o) => {
                const wpPickerInputWrap = e.wrap[0].querySelector('.wp-picker-input-wrap');
                wpPickerInputWrap.classList.toggle('hidden');
                e.pickerContainer.toggleClass('hidden');
                o.stopPropagation();
                if (this.shown) {
                    this.pickr.hide();
                    this.shown = false;

                    this.wrapper.css('display', '');
                    this.wrapper[0].appendChild(this.toggler[0]);
                    t("body").off("click", e._bodyListener);
                    
                    window._openPickr = null;
                } else {
                    // Move the toggler to the input element
                    this.wrapper.css('display', 'none');
                    wpPickerInputWrap.insertBefore(this.toggler[0], wpPickerInputWrap.firstElementChild);
                    t("body").on("click", {
                        wrap: e.wrap,
                        toggler: e.toggler
                    }, e._bodyListener);
                    if (window._openPickr) {
                        window._openPickr.click();
                    }
                    window._openPickr = e.toggler;
                    e.pickr.show();
                    this.shown = true;
                }
                e.button.toggleClass("hidden");
                e.toggler.toggleClass("wp-picker-open");
            });

            e.toggler.on("keyup", function (t) {
                (13 === t.keyCode || 32 === t.keyCode) && (t.preventDefault(), e.toggler.trigger("click").next().focus())
            });

            e.element.change(function (o) {
                var i = t(this),
                    r = i.val();
                e._ignoreChange = true;
                if ("" === r || "#" === r) {
                    e.pickr.setColor(clearColor);
                    t.isFunction(e.options.clear) && e.options.clear.call(this, o);
                } else {
                    e.pickr.setColor(r);
                }
            });

            e.button.click(function (o) {
                var i = t(this);
                if (i.hasClass("wp-picker-clear")) {
                    e.pickr.setColor(clearColor);
                    e.element.val("");
                    t.isFunction(e.options.clear) && e.options.clear.call(this, o);
                } else {
                    e.pickr.setColor(e.options.defaultColor);
                    i.hasClass("wp-picker-default") && e.element.val(e.options.defaultColor).change()
                }
            });
        },
        _bodyListener: function (t) {
            if (t.data.wrap.find(t.target).length || t.target.closest('.pcr-app')) return;
            t.data.toggler.click();
        },
        color: function(t) {
            if (t === undefined) {
                return this.pickr.getColor().toRGBA().toString();
            } else {
                this.pickr.setColor(t);
            }
        },
        defaultColor: function(t) {
            if (t === undefined) {
                return this.options.defaultColor;
            } else {
                this.options.defaultColor = t;
            }
        }
    };

    t.widget("wp.wpColorPicker", o)
}(jQuery);