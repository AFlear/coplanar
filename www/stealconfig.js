steal.config({
    startFile: 'coplanar-gv.js',
    shim : {
        'jquery': {
            exports: "jQuery",
        },
        'jquery-ui': {
            deps: ["jquery"],
            exports: "jQuery.ui",
        },
        'fullcalendar': {
            deps: ["jquery-ui"],
            exports: "jQuery.fullcalendar",
        },
    },
});
