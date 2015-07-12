var gulp         = require('gulp')
  , del          = require('del')
  , colors       = require('gulp-util').colors
  , File         = require('gulp-util').File
  , files        = require('gulp-filenames')
  , markdown     = require('gulp-markdown')
  , jade         = require('gulp-jade')
  , stylus       = require('gulp-stylus')
  , rename       = require("gulp-rename")
  , config       = require('./config')
  , fs           = require('fs')
  , path         = require('path')
  , _            = require('lodash')
  , browserSync  = require('browser-sync')
  , reload       = browserSync.reload

  , errorHandler = function(err) {
      console.log(colors.red('ERROR: ') +
        colors.yellow(err.plugin) +
        colors.red(' =>'), err.message)
      this.emit('end')
    }

// Clean Dist And Get Prepared
gulp.task('clean-all', function(cb) {
  del('dist/**/*', cb)
})

gulp.task('clean-resource', function(cb) {
  del('dist/resource/*', cb)
})

gulp.task('clean-posts', function(cb) {
  del(['dist/posts/*'], cb)
})

// Compile Stylus
gulp.task('stylus', function() {
  return gulp.src('theme/' + config.theme + '/resource/stylus/**/*.styl'
    , {base: 'theme/' + config.theme + '/resource/stylus'})
    .pipe(stylus({compress: true}))
    .pipe(gulp.dest('theme/' + config.theme + '/resource/css'))
})

// Copy Static Files From Resource
gulp.task('copy', ['stylus', 'clean-resource'], function() {
  var themePath = 'theme/' + config.theme

  return gulp.src([themePath + '/resource/**/*.!(styl)'
    , themePath + '/*.@(png|ico)'], {base: 'theme/' + config.theme})
    .pipe(gulp.dest('dist'))
    .pipe(reload({stream: true}))
})

// Get The Source Posts
gulp.task('get-posts', function() {
  files.forget('all')

  return gulp.src('source/posts/**/*.@(md|MD|markdown|Markdown)', {base: '.'})
    .pipe(files('markdown'))
})

// Render Pages With Markdown Files
gulp.task('render-posts', ['get-posts', 'clean-posts'], function(cb) {
  var gss = files.get('markdown')
    .map(function(cur) {
      return gulp.src(cur, {base: 'source'})
        .pipe(markdown())
        .on('error', errorHandler)
        .pipe(files('posts'))
        .pipe(gulp.dest('dist'))
    })

  return gss[gss.length - 1]
})

// Insert Rendered MD In To Jade
gulp.task('jade-posts', ['render-posts'], function() {
  var gss = files.get('posts')
    .map(function(cur) {
      return gulp.src('theme/' + config.theme + '/tpl/article.jade')
        .pipe(jade({
          locals: {
            name: path.basename(cur, '.html')
          , content: fs.readFileSync('dist/' + cur)
          , slogan: config.slogan || ''
          , email: config.email || ''
          , link: config.link || ''
          }
        }))
        .on('error', errorHandler)
        .pipe(rename(path.dirname(cur) + '/' + path.basename(cur)))
        .pipe(gulp.dest('dist'))
        .pipe(reload({stream: true}))
    })

  return gss[gss.length - 1]
})

// Finally Render The Index Page
gulp.task('render-entrance', ['jade-posts'], function() {
  var posts = files.get('posts')
    , articles = _.chain(posts)
      .map(function(p) {
        return path.basename(p, '.html')
      })
      .zip(posts)
      .map(function(p) {
        return {
          name: p[0]
        , path: p[1]
        }
      })
      .sortBy('name')
      .value()
      // .sort()
      .reverse()

  return gulp.src(['theme/' + config.theme + '/tpl/index.jade']
    , {base: 'theme/' + config.theme + '/tpl'})
    .pipe(jade({
      locals: {
        name: config.name
      , description: config.description || ''
      , slogan: config.slogan || ''
      , email: config.email || ''
      , list: articles
      , link: config.link || ''
      }
    }))
    .on('error', errorHandler)
    .pipe(gulp.dest('dist'))
    .pipe(reload({stream: true}))
})

// Devlope using BrowserSync
gulp.task('dev', ['build'], function() {
  browserSync({
    server: {
      baseDir: 'dist'
    }
  })

  gulp.watch('theme/' + config.theme + '/**/*.styl', ['copy'])
  gulp.watch(['theme/' + config.theme + '/**/*.jade'
    , 'source/**/*.@(md|MD|markdown|Markdown)'], ['render-entrance'])
})

// Build All For Once
gulp.task('build', ['render-entrance', 'copy'], function() {
  console.log(colors.green('Generated ') +
    files.get('posts').length + colors.green(' posts totally.'))
})

//Gen Is Alias Of Build
gulp.task('gen', ['render-entrance', 'copy'], function() {
  console.log(colors.green('Generated ') +
    files.get('posts').length + colors.green(' posts totally.'))
})

// Just Static Server With Live Reload
gulp.task('server', ['build'], function() {
  browserSync({
    server: {
      baseDir: 'dist'
    }
  })

  gulp.watch('source/**/*.@(md|MD|markdown|Markdown)', ['render-entrance'])
})

// Create A New Empty Post File
gulp.task('new', function() {
  var argv = process.argv.slice(3)
  if (argv.length < 2) {
    console.log(colors.red('Please use format: ') +
      colors.green('`gulp new --name \'your new post title\'`'))
    return 'no!!!!'
  }

  var now = new Date()
    , date = now.toISOString().split('T')[0].split('-')
    , filename = date.concat(argv[1].split(' ')).join('-') + '.md'

  console.log(colors.green('Creating `source/posts/' + filename + '`'))
  fs.closeSync(fs.openSync('source/posts/' + filename, 'w'));
  console.log(colors.green('Created~'))
})

gulp.task('default', ['render-entrance', 'copy'])
