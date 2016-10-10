var fs = require('fs')
var path = require('path')

var RE_BASENAMES = /^(template|index|style)/
var RE_STYLE_SCOPED = /^style.scoped/

function readFile (file, options, callback) {
  var loaderContext = options.loaderContext
  var loaders = options.loaders || {}

  // For files with extensions that can be loaded, read the file content
  var ext = path.extname(file)
  var basename = path.basename(file, ext)
  var execBasename = RE_BASENAMES.exec(basename)
  var type = (execBasename && execBasename[0]) || undefined
  var isStyleScoped = !!RE_STYLE_SCOPED.exec(basename) || false

  // Treat index.* as script
  type = (type === 'index') ? 'script' : type

  var isValidType = !!type || isStyleScoped
  var hasLoader = loaders[ext.substr(1)]

  if (isValidType && hasLoader) {
    loaderContext.resolve(loaderContext.context, './' + file, function (err, path) {
      if (err) {
        // Silently ignore files that can't be read
        callback(null, null)
      } else {
        loaderContext.addDependency(path)
        fs.readFile(path, 'utf8', function (err, content) {
          var result = (err) ? {} : {
            content: content,
            src: path,
            scoped: isStyleScoped
          }

          callback(type, result)
        })
      }
    })
  } else {
    // Ignore files that are not template.*, index.* (script) and style.*
    callback(null, null)
  }
}

function readDir (dirname, options, callback) {
  var output = {}
  var count = 0

  function done () {
    if (count <= 0) {
      callback(output)
    }
  }

  // List all files in directory /path/to/Component.vue/<files>
  fs.readdir(dirname, function (err, files) {
    if (err) {
      // Fallback to index.js if directory can't be read'
      done(options.output)
    } else {
      count = files.length

      files.forEach(function (file) {
        readFile(file, options, function (type, result) {
          count--

          if (result) {
            if (type === 'style') {
              output.styles = output.styles || []
              output.styles.push(result)
            } else {
              // TODO handle edge case where multiple template and script files and choose one (default lang if present?)
              output[type] = result
            }
          }

          done()
        })
      })
    }
  })
}

module.exports = function (script, filePath, loaders, loaderContext, callback) {
  var readDirOptions = {
    loaders: loaders,
    loaderContext: loaderContext,
    output: {
      script: {
        content: script,
        src: path
      }
    }
  }

  readDir(path.dirname(filePath), readDirOptions, callback)
}
