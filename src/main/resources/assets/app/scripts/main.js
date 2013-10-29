require.config({
  paths: {
    'hbs'                   : 'vendor/require-handlebars-plugin/hbs',
    'handlebars'            : 'vendor/require-handlebars-plugin/Handlebars',
    'text'                  : 'vendor/text',
    'jquery'                : 'vendor/jquery',
    'lodash'                : 'vendor/lodash',
    'backbone'              : 'vendor/backbone',
    'backbone/declarative'  : 'vendor/backbone.declarative',
    'backbone/validations'  : 'vendor/backbone.validations',
    'backbone/mousetrap'    : 'vendor/backbone.mousetrap',
    'bootstrap/tooltip'     : 'vendor/bootstrap/js/bootstrap-tooltip',
    'bootstrap/alert'       : 'vendor/bootstrap/js/bootstrap-alert',
    'bootstrap/button'      : 'vendor/bootstrap/js/bootstrap-button',
    'bootstrap/dropdown'    : 'vendor/bootstrap/js/bootstrap-dropdown',
    'bootstrap/timepicker'  : 'vendor/bootstrap-timepicker/js/bootstrap-timepicker',
    'd3'                    : 'vendor/d3.v3',
    'underscore'            : 'vendor/lodash',
    'moment'                : 'vendor/moment.min',
    'backpack'              : 'vendor/backpack',
    'jquery/autotype'       : 'vendor/bootstrap-timepicker/js/jquery.autotype',
    'jquery/select2'        : 'vendor/select2',
    'jquery/pickadate'      : 'vendor/pickadate',
    'jquery/visibility'     : 'vendor/jquery/jquery.visibility',
    'jquery/fastLiveFilter' : 'vendor/jquery/jquery.fastLiveFilter',
    'coffee-script'         : 'vendor/coffee-script',
    'cs'                    : 'vendor/cs',
    'propertyParser'        : 'vendor/requirejs-plugins/src/propertyParser',
    'font'                  : 'vendor/requirejs-plugins/src/font',
    'mousetrap'             : 'vendor/mousetrap',
    'mocha'                 : 'vendor/tests/mocha',
    'chai'                  : 'vendor/tests/chai',
    'chai-jquery'           : 'vendor/tests/chai-jquery',
    'chai-backbone'         : 'vendor/tests/chai-backbone'
  },
  map: {
    '*': {
      'css-builder'  : 'vendor/require-css/css-builder',
      'less-builder' : 'vendor/require-less/less-builder',
      'lessc-server' : 'vendor/require-less/lessc-server',
      'lessc'        : 'vendor/require-less/lessc',
      'css'          : 'vendor/require-css/css',
      'less'         : 'vendor/require-less/less'
    },
    'css': {
      'normalize'   : 'vendor/require-css/normalize'
    },
    'less': {
      'normalize'   : 'vendor/require-css/normalize'
    },
    'hbs': {
      'i18nprecompile' : 'vendor/require-handlebars-plugin/hbs/i18nprecompile',
      'json2'          : 'vendor/require-handlebars-plugin/hbs/json2'
    }
  },
  hbs: {
    disableI18n: true,
    helperDirectory: 'templates/helpers/',
    helperPathCallback: function(name) {
      var n = name.split(/(?=[A-Z])/);
      return 'templates/helpers/' + n.join('_').toLocaleLowerCase();
    }
  },
  shim: {
    'jquery/select2': {
      deps: ['jquery'],
      exports: 'jQuery.fn.select2'
    },
    'jquery/fastLiveFilter': {
      deps: ['jquery'],
      exports: 'jQuery.fn.fastLiveFilter'
    },
    'jquery/pickadate': {
      deps: ['jquery'],
      exports: 'jQuery.fn.pickadate'
    },
    'jquery/visibility': {
      deps: ['jquery'],
      exports: 'jQuery.fn._pageVisibility'
    },
    'bootstrap/tooltip': {
      deps: ['jquery'],
      exports: 'jQuery.fn.tooltip'
    },
    'bootstrap/alert': {
      deps: ['jquery'],
      exports: 'jQuery.fn.alert'
    },
    'bootstrap/button': {
      deps: ['jquery'],
      exports: 'jQuery.fn.button'
    },
    'bootstrap/timepicker': {
      deps: ['jquery', 'jquery/autotype', 'bootstrap/dropdown'],
      exports: 'jQuery.fn.timepicker'
    },
    'mousetrap': {
      deps: [],
      exports: 'Mousetrap'
    },
    'chai-jquery': {
      deps: ['jquery', 'chai']
    },
    'chai-backbone': {
      deps: ['backbone', 'chai']
    },
    'backbone/validations': {
      deps: ['backbone', 'underscore'],
      exports: 'Backbone.Validations.Model'
    }
  }
});

require(['styles', 'fonts'], function(){});

require([
  'jquery',
  'underscore',
  'routers/application',
  'collections/jobs',
  'collections/details',
  'collections/results',
  'collections/job_graph',
  'parsers/iso8601',
  'components/configured_rivets',
  'jquery/fastLiveFilter'
],
function($,
         _,
         ApplicationRouter,
         JobsCollection,
         DetailsCollection,
         ResultsCollection) {

  var app;

  window.app = app = {
    Models: {},
    Collections: {},
    Views: {},
    Routers: {},

    Helpers: {
      filterList: function() {
        var $jobs = $('.result-jobs-count'),
            $errors = $('.failed-jobs-count');

        $('#search-filter').change(function(){
          var q = $.trim(this.value);
          if (q.length > 0) {
            window.app.jobsCollection.fetch({data: {any: q},
              success: function() {
                window.app.router.index();
              }
            });
          } else {
            window.app.jobsCollection.fetch({
              success: function() {
                window.app.router.index();
              }
            });
          }
       });
      },

      makePath: function() {
        var hash = window.location.hash,
            parts = hash.split('/') ;

        console.log(hash, parts)
        if (hash) {
          parts = parts.join('/') + '/';
          return parts;
        } else {
          return 'jobs/';
        }
      },

      /**
       * dayYear returns a number equal to
       * the number of the day [0, 366] plus
       * the year (2012).
       *
       * @params date - a date object
       */
      dayYear: function(date) {
        var dayFormat = d3.time.format('%j'),
            yearFormat = d3.time.format('%Y'),
            day = parseInt(dayFormat(date), 10),
            year = parseInt(yearFormat(date), 10);
        return day + year;
      }
    },

    init: function() {
      window.app || (window.app = {});
      var jobsCollection = new JobsCollection();

      jobsCollection.fetch().done(function() {
        jobsCollection.each(function(job) {
          job.set({persisted: true}, {silent: true});
        });

        window.app.detailsCollection = new DetailsCollection()
        window.app.resultsCollection = new ResultsCollection(jobsCollection.models)
        window.app.router = new ApplicationRouter();
        Backbone.history.start();
        app.Helpers.filterList();

        jobsCollection.fetch();
        //startPolling();
        //window.app.jobsGraphCollection.startPolling();
      });

      window.app.jobsCollection = jobsCollection;
    }
  };

  $(document).ready(function(){
    app.init();
  });

});
