steal.config({
    startFile: 'coplanar-gv.js',
    shim : {
        'jquery': {
            exports: "jQuery",
            packaged: false,
        },
        'jquery-ui': {
            deps: ["jquery"],
            exports: "jQuery.ui",
            packaged: false,
        },
        'fullcalendar': {
            deps: ["jquery-ui"],
            exports: "jQuery.fullcalendar",
            packaged: false,
        },
    },
    paths: {
        'jquery/jquery.js': 'jquery/jquery.min.js',
        'jquery-ui/jquery-ui.js': 'jquery-ui/jquery-ui.min.js',
        'fullcalendar/fullcalendar.js': 'fullcalendar/fullcalendar.min.js',
    },
});
