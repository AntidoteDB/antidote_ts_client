var gulp = require("gulp");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");

gulp.task("protobuf_defs", function() {
	// node_modules/protobufjs/bin/pbjs src/antidote.proto > dist/antidote.json
	//node node_modules/proto2ts/command.js -f dist/antidote.json > src/antidote_pb.d.ts
});

gulp.task("default", function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("dist"));
});