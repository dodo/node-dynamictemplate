from os.path import dirname, join
import os

topdir = "."
outdir = "build"

class Dummy: pass


def configure(ctx):
    ctx.env.PATH = os.environ['PATH'].split(os.pathsep)
    ctx.env.PATH.append(join(ctx.cwd, "node_modules", ".bin"))
    ctx.env.PATH.append(join(ctx.cwd, "node_modules", "browserify", "bin"))
    ctx.env.PATH.append(join(ctx.cwd, "node_modules", "coffee-script", "bin"))
    ctx.find_program("browserify", var="BROWSERIFY", path_list=ctx.env.PATH)
    ctx.find_program("coffee", var="COFFEE", path_list=ctx.env.PATH)
    ctx.env.BROWSERIFY_ARGS = "-p scopify -o"
    ctx.env.COFFEE_ARGS = "-co"
    ctx.env.set_variant("default")


def build(ctx):
    env = Dummy()
    env.variant = lambda: ""
    for file in ctx.path.find_dir("src").ant_glob("**/*.coffee", flat=False):
        tgtpath = file.change_ext(".js").bldpath(env)[5:]
        ctx.path.exclusive_build_node(tgtpath)
        ctx(name   = "coffee",
            rule   = "${COFFEE} ${COFFEE_ARGS} %s/%s ${SRC}" % (
                     ctx.env.variant(),dirname(tgtpath)),
            source = file.srcpath()[3:],
            target = tgtpath)

    file = ctx.path.find_dir("src").ant_glob("**/dynamictemplate.coffee", flat=False)[0]
    tgtpath = file.change_ext(".browser.js").bldpath(env)[5:]
    ctx.path.exclusive_build_node(tgtpath)
    ctx(name   = "browserify",
        rule   = "${BROWSERIFY} ${SRC} ${BROWSERIFY_ARGS} ${TGT}",
        source = file.srcpath()[3:],
        target = tgtpath)

    file = ctx.path.find_dir("src").ant_glob("**/dynamictemplate-jquery.coffee", flat=False)[0]
    tgtpath = file.change_ext(".browser.js").bldpath(env)[5:]
    ctx.path.exclusive_build_node(tgtpath)
    ctx(name   = "browserify",
        rule   = "${BROWSERIFY} ${SRC} ${BROWSERIFY_ARGS} ${TGT}",
        source = file.srcpath()[3:],
        target = tgtpath)
