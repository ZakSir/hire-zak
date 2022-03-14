const gulp = require('gulp');
const less = require('gulp-less');

const srcGlob = './css/**/*.less';
const destination = './css/min';

gulp.task('less', function(cb) {
    gulp.src(srcGlob)
        .pipe(less())
        .pipe(gulp.dest(function(f) {
            return f.base;
        }));

    cb();
});

gulp.task('default', gulp.series('less', function(cb) {
    gulp.watch(srcGlob, gulp.series('less'));
    cb()
}));