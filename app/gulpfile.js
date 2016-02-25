'use strict';

var gulp = require('gulp'),
	gutil = require('gulp-util'),
	sass = require('gulp-sass'),
	prefix = require('gulp-autoprefixer'),
	compress = require('gulp-compressor'),
	notify = require('gulp-notify'),
	gulpif = require('gulp-if'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	size = require('gulp-size'),
	insert = require('gulp-insert'),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	watch = require('gulp-watch'),
	filter = require('gulp-filter'),
	debug = require('gulp-debug'),
	del = require('del'),
	runSequence = require('run-sequence'),
	browserSync = require('browser-sync').create();

//// Load config
var config = require('./config.json');


////// Tasks

//// Compile CSS
gulp.task('css', function() {
	// Grab global SCSS file
	return gulp.src(config.paths.assets+config.paths.scss+config.fileName.scss)
	// [DEV] Import __dev.scss only when we're in dev
	.pipe(gulpif(config.isDev, insert.append('@import "base/_dev";')))
	// Compile SCSS to CSS
	.pipe(sass())
	// [BUILD] Auto-prefix
	.pipe(gulpif(config.isBuild, prefix(config.options.autoprefixer)))
	// [BUILD] Minifiy
	.pipe(gulpif(config.isBuild, compress()))
	// Show file size
	.pipe(size(config.options.size))
	// Create final file
	.pipe(gulp.dest(config.paths.dist+config.paths.css))
	// Notify end task
	.pipe(notify(config.fileName.css+' compiled'));
});

//// IE9.css
gulp.task('ie9', function() {
	// Grab ie9 file
	return gulp.src(config.paths.assets+config.paths.scss+'ie9.scss')
	// Compile SCSS to CSS
	.pipe(sass())
	// [BUILD] Minify
	.pipe(gulpif(config.isBuild, compress()))
	// Show file size
	.pipe(size(config.options.size))
	// Create file file
	.pipe(gulp.dest(config.paths.dist+config.paths.css))
	// Notify end task
	.pipe(notify('ie9.css compiled'));
});

//// Compile JS
gulp.task('js', function() {
	// Grab all JS files starting with the vendors folder first
	return gulp.src([config.paths.assets+config.paths.js+'/vendors/*.js', config.paths.assets+config.paths.js+'/*.js'])
	// Merge them in one global file
	.pipe(concat(config.fileName.js))
	// [BUILD] Remove comments & console.log
	.pipe(gulpif(config.isBuild, uglify(config.options.uglify) ))
	// Log the final JS file size
	.pipe(size(config.options.size))
	// Create the final JS file
	.pipe(gulp.dest(config.paths.dist+config.paths.js))
	// Notify end task
	.pipe(notify(config.fileName.js+' compiled'));
});

//// Optimize & Compress images
// [TODO] R&D on the best settings + add caching
gulp.task('img', function () {
	// Grab all the images
	return gulp.src(config.paths.assets+config.paths.img+'**/*')
		// Optimize
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		}))
		// Move the optimized files in the dist folder
		.pipe(gulp.dest(config.paths.dist+config.paths.img));
});

//// [DEV] Copy files from assets to dist folder
// We're not optimizing them yet, we'll optimize them when we use gulp build
// Watch if a new file is added
function isAdded(file) {
	return file.event === 'add';
}
var filterAdded = filter(isAdded);
// Move the files task
gulp.task('assets-to-dist', function () {
	gulp.src([config.paths.assets+'**/*', '!'+config.paths.assets+config.paths.js+'*', '!'+config.paths.assets+config.paths.scss+'**/*'])
		// Don't watch the js and scss folders since these folders get compiled
		.pipe(watch([config.paths.assets+'**/*', '!'+config.paths.assets+config.paths.js+'*', '!'+config.paths.assets+config.paths.scss+'**/*']))
		.pipe(filterAdded)
		.pipe(debug({title: 'New file moved to dist folder:'}))
		.pipe(gulp.dest(config.paths.dist))
});

//// [BUILD] Since the build folder get deleted, copy&move all other files who don't have a specific build task to dist (ex. /fonts/)
gulp.task('assets-other-build', function () {
	gulp.src([config.paths.assets+'**/*', '!'+config.paths.assets+'{js,js/**/*}', '!'+config.paths.assets+'{scss,scss/**/*}', '!'+config.paths.assets+'{img,img/**/*}'], {
			base: config.paths.assets
		}).pipe(gulp.dest(config.paths.dist));
});

// Clean the dist folders
gulp.task('clean', function() {
	return del(config.paths.dist, config.options.del);
});

// Run Browser Sync - useful for QA on multiple devices
gulp.task('server', function() {
	browserSync.init({
		proxy: config.url
	});
});

//// Main 2 tasks
// Watch using 'gulp'
gulp.task('watch', function() {
	// Watch SCSS folder but not the ie9 file since we have a specific task for it
	gulp.watch([config.paths.assets+config.paths.scss+'**/*.scss','!'+config.paths.assets+config.paths.scss+'ie9.scss'], ['css'] );
	// Watch ie9.scss
	gulp.watch(config.paths.assets+config.paths.scss+'ie9.scss', ['ie9'] );
	// Watch JS folder
	gulp.watch(config.paths.assets+config.paths.js+'/**/*.js', ['js'] );
	// Watch for any other folders
	gulp.start('assets-to-dist');
	// If --server flag is added, run proxy server.
	if(gutil.env.server === true) {
		gulp.start('server');
	}
});
// Build using 'gulp build'
gulp.task('build', ['clean'], function() {
	// Switch environnement
	config.isDev = false;
	config.isBuild = true;
	// Run task one after another to avoid any potential bugs
	runSequence('assets-other-build', 'css', 'ie9', 'js', 'img');
});

// The default task
gulp.task('default', ['watch']);