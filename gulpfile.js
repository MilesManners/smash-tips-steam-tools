const gulp = require('gulp')
const gutil = require('gulp-util')
const sass = require('gulp-sass')
const pug = require('gulp-pug')
const sourcemaps = require('gulp-sourcemaps')
const bump = require('gulp-bump')
const zip = require('gulp-zip')
const fs = require('fs')
const path = require('path')
const cp = require('child_process')
const args = require('yargs').argv
const packageJson = require('./package.json')

function getFolders (dir) {
  return fs.readdirSync(dir).filter(file => fs.statSync(path.join(dir, file)).isDirectory())
}

gulp.task('sass', () => {
  return gulp.src('./css/sass/*.@(sass|scss)')
    .pipe(sourcemaps.init())
    .pipe(sass({ style: 'compressed' }).on('error', gutil.log))
    .pipe(sourcemaps.write('../css'))
    .pipe(gulp.dest('./css'))
})

gulp.task('sass-debug', () => {
  return gulp.src('./css/sass/*.@(sass|scss)')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', gutil.log))
    .pipe(sourcemaps.write('../css'))
    .pipe(gulp.dest('./css'))
})

gulp.task('pug', () => {
  return gulp.src('./html/pug/*.pug')
    .pipe(pug())
    .pipe(gulp.dest('./html'))
})

gulp.task('pug-debug', () => {
  return gulp.src('./html/pug/*.pug')
    .pipe(pug({ pretty: true }))
    .pipe(gulp.dest('./html'))
})

gulp.task('sass:watch', () => {
  gulp.watch('./css/sass/*.@(sass|scss)', gulp.series('sass'))
})

gulp.task('pug:watch', () => {
  gulp.watch('./html/pug/*.pug', gulp.series('pug'))
})

gulp.task('bump', () => {
  /// <summary>
  /// It bumps revisions
  /// Usage:
  /// 1. gulp bump : bumps the package.json and bower.json to the next minor revision.
  ///   i.e. from 0.1.1 to 0.1.2
  /// 2. gulp bump --ver 1.1.1 : bumps/sets the package.json and bower.json to the specified revision.
  /// 3. gulp bump --type major       : bumps 1.0.0
  ///    gulp bump --type minor       : bumps 0.1.0
  ///    gulp bump --type patch       : bumps 0.0.2
  ///    gulp bump --type prerelease  : bumps 0.0.1-2
  /// </summary>

  let type = args.type
  let version = args.ver
  let options = {}
  if (version) {
    options.version = version
  } else {
    options.type = type
  }

  return gulp.src('./package.json')
    .pipe(bump(options))
    .pipe(gulp.dest('./'))
})

gulp.task('electron', () => {
  const appName = packageJson.name
  const electronVer = `v${packageJson.devDependencies.electron.match(/\^(\d.*)/)[1]}`
  const appVer = packageJson.version

  return cp.exec(`electron-packager . ${appName}-${appVer} --build-version ${appVer} --electronVer ${electronVer} --out ./dist`)
})

gulp.task('zip', () => {
  return Promise.all(getFolders('./dist').map(folder => {
    return new Promise((resolve, reject) =>
      gulp.src(`./dist/${folder}/*`)
        .pipe(zip(`${folder}.zip`))
        .on('error', reject)
        .pipe(gulp.dest('./dist'))
        .on('end', resolve)
  )
  }))
})

gulp.task('watch', gulp.parallel('sass:watch', 'pug:watch'))

gulp.task('default', gulp.parallel('sass', 'pug'))

gulp.task('dist', gulp.series('bump', 'sass', 'pug', 'electron', 'zip'))
