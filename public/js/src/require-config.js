/**
 * The common require.js configuration file, to be loaded in the main-xxxx files.
 */

require.config( {
    baseUrl: "/js/src/module",
    paths: {
        "require-config": "../require-config",
        "core-lib": "../../../lib/enketo-core/lib",
        "enketo-js": "../../../lib/enketo-core/src/js",
        "enketo-widget": "../../../lib/enketo-core/src/widget",
        "enketo-config": "../../../client-config.json",
        "text": "../../../lib/enketo-core/lib/text/text",
        "xpath": "../../../lib/enketo-core/lib/xpath/build/enketo-xpathjs",
        "jquery.xpath": "../../../lib/enketo-core/lib/jquery-xpath/jquery.xpath",
        "bootstrap-slider": "../../../lib/enketo-core/lib/bootstrap-slider/js/bootstrap-slider",
        "jquery": "../../../lib/bower-components/jquery/dist/jquery",
        "jquery.touchswipe": "../../../lib/enketo-core/lib/jquery-touchswipe/jquery.touchSwipe",
        "leaflet": "../../../lib/bower-components/leaflet/dist/leaflet",
        "merge-xml": "../../../lib/bower-components/mergexml/mergexml",
        "q": "../../../lib/bower-components/q/q",
        "i18next": "../../../lib/bower-components/i18next/i18next.amd",
        "print": "../../../lib/enketo-core/src/js/print",
        "db": "../../../lib/bower-components/db.js/src/db",
        "vex": "../../../lib/bower-components/vex/js/vex",
        "papaparse": "../../../lib/bower-components/papaparse/papaparse",
    },
    shim: {
        "xpath": {
            exports: "XPathJS"
        },
        "enketo-widget/date/bootstrap3-datepicker/js/bootstrap-datepicker": {
            deps: [ "jquery" ],
            exports: "jQuery.fn.datepicker"
        },
        "enketo-widget/time/bootstrap3-timepicker/js/bootstrap-timepicker": {
            deps: [ "jquery" ],
            exports: "jQuery.fn.timepicker"
        },
        "leaflet": {
            exports: "L"
        },
        "db": [ 'promise-by-Q' ],
    }
} );
