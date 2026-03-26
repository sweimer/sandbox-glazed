const sass = require("sass");
const autoprefixer = require("autoprefixer");
const postcssPxtorem = require("postcss-pxtorem");
const webpackConfig = require('./webpack.config.js');

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    // -----------------------------
    // Webpack → Babel → Terser
    // -----------------------------
    webpack: {
      myConfig: webpackConfig,
    },

    babel: {
      options: {
        sourceMap: false,
      },
      dist: {
        files: [
          {
            expand: true,
            cwd: 'js/dist/',
            src: [
              '*.js',
              '!dxpr-theme-header.js',
              '!dxpr-theme-multilevel-mobile-nav.js',
              '!dxpr-theme-settings-admin.js',
              '!dxpr-theme-settings-sidebar.js',
            ],
            dest: 'js/minified/',
            ext: '.min.js',
          },
        ],
      },
    },

    terser: {
      options: {
        ecma: 2022,
      },
      main: {
        files: [
          {
            expand: true,
            cwd: 'js/minified/',
            src: [
              '*.min.js',
              '!dxpr-theme-header.bundle.min.js',
              '!dxpr-theme-multilevel-mobile-nav.bundle.min.js',
              '!dxpr-theme-settings-admin.bundle.min.js',
              '!dxpr-theme-settings-sidebar.bundle.min.js',
            ],
            dest: 'js/minified/',
            ext: '.min.js',
          },
        ],
      },
    },

    // -----------------------------
    // Sass → CSS → PostCSS
    // -----------------------------
    sass: {
      options: {
        implementation: sass,
        sourceMap: false,
        outputStyle: "compressed",
      },
      dist: {
        files: [
          {
            expand: true,
            cwd: "scss/",
            src: "**/*.scss",
            dest: "css/",
            ext: ".css",
            extDot: "last",
          },
        ],
      },
    },

    postcss: {
      options: {
        processors: [
          autoprefixer(),
          postcssPxtorem({
            rootValue: 16,
            unitPrecision: 5,
            propList: ["*"],
            selectorBlackList: [],
            replace: true,
            mediaQuery: true,
            minPixelValue: 0,
          }),
        ],
      },
      dist: {
        src: "css/**/*.css",
      },
    },

    // -----------------------------
// HUDX EXPORT TASKS
// -----------------------------
    concat: {
      hudx: {
        src: ["css/**/*.css"],
        dest: "/app/apps/css/hudx.css",
      },
    },

    copy: {
      hudx: {
        files: [
          {
            src: "/app/apps/css/hudx.css",
            dest: "/app/apps/css/hudx.css",
          },
        ],
      },
    },

    // -----------------------------
    // Watchers
    // -----------------------------
    watch: {
      css: {
        files: ["scss/**/*.scss"],
        tasks: ["sass", "postcss", "hudx-css"],
      },
      js: {
        files: ["js/dist/**/*.js", "!js/minified/**/*.js"],
        tasks: ["webpack", "babel", "terser"],
      },
    },
  });

  // Load tasks
  grunt.loadNpmTasks("grunt-webpack");
  grunt.loadNpmTasks("grunt-babel");
  grunt.loadNpmTasks("grunt-terser");
  grunt.loadNpmTasks("grunt-sass");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("@lodder/grunt-postcss");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-copy");

  // -----------------------------
  // HUDX CSS EXPORT TASK
  // -----------------------------
  grunt.registerTask("hudx-css", [
    "sass",
    "postcss",
    "concat:hudx",
    "copy:hudx",
  ]);

  // -----------------------------
  // Full Build Task
  // -----------------------------
  grunt.registerTask("build", [
    "sass",
    "postcss",
    "webpack",
    "babel",
    "terser",
    "hudx-css",
  ]);

  grunt.registerTask("default", ["watch"]);
};
