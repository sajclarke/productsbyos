// Load plugins
const browsersync = require('browser-sync').create();
const gulp = require('gulp');
var nunjucksRender = require('gulp-nunjucks-render');
var data = require('gulp-data');
var path = require('path');
var fs = require('fs');
var netlify = require('gulp-netlify');
var merge = require('gulp-merge-json');

var git = require('gulp-git');

const imagemin = require('gulp-imagemin');

var manageEnvironment = function(env) {
  env.addFilter('split', function(str, seperator) {
    return str.split(seperator);
  });
};

var findFiles = function(folder) {
  var posts = [];
  // var postsfolder = './posts';

  var files = fs.readdirSync(folder);

  files.forEach(file => {
    let fileStat = fs.statSync(folder + '/' + file).isDirectory();
    if (!fileStat) {
      if (file.includes('json')) {
        posts.push(JSON.parse(fs.readFileSync(folder + '/' + file)));
      }
    }
  });

  return posts;
};

gulp.task('render_content', function(cb) {
  // Copy assets to dist folder
  gulp.src(['./assets/**/*']).pipe(gulp.dest('./build/assets/'));
  gulp.src(['pages/**/*.yml']).pipe(gulp.dest('./build/'));

  //Render nunjucks to html
  gulp
    .src('pages/**/*.+(html|njk)')
    // Adding data to Nunjucks

    .pipe(
      data(function() {
        var contents = { articles: findFiles('./posts'), products: findFiles('./products') };
        return contents;
      })
    )
    .pipe(
      nunjucksRender({
        path: ['templates/'], // String or Array
        data: {
          site_title: 'Os Foods',
          instagram_username: '',
          contact_form_url: 'https://docs.google.com/forms/d/1DOxT0tkNRE35pucLyZMH_eght_Enhr0RcofOX-8C3xs/formResponse'
        },
        envOptions: {
          watch: false
        },
        manageEnv: manageEnvironment
      })
    )
    .pipe(gulp.dest('build'));
  cb();
});

gulp.task('render_images', function(cb) {
  gulp
    .src('./assets/images/**/*')
    .pipe(imagemin())
    .pipe(gulp.dest('build/assets/images'));
  cb();
});

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: './build'
    }
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  // gulp.parallel("vendor");
  browsersync.reload();
  done();
}

// Watch files
function watchFiles(done) {
  gulp.watch('./posts/**/*', gulp.series('render_content'));
  gulp.watch('./assets/**/*', gulp.series('render_content'));
  gulp.watch('./templates/**/*', gulp.series('render_content'));
  gulp.watch('./pages/**/*', gulp.series('render_content'));
  gulp.watch('./build/*.html', browserSyncReload);
  done();
}

gulp.task('default', gulp.parallel('render_content', 'render_images'));

// dev task
gulp.task('dev', gulp.parallel('render_content', watchFiles, browserSync));
