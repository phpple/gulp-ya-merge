const through = require('through2');
const path = require('path');
const crypto = require('crypto');

const matchFlags = {
  'fileExp': /<\?\=\s*\$this\->StaticUrl\(\s*\'([^\']+)\'\s*\)\s*\?>/gm,
  'leftFlag': '<!--min[',
  'rightFlag': ']-->',
  'newPath': '<?=$this->StaticUrl(\'{$base}-{$stamp}{$ext}\')?>',
  'hashLength': 8,
  'jsExp': /(<script\s(?:.*)\$this->StaticUrl\([\'\"])([^\'\"\-]+)([\'\"]\)(?:[^\/]*)><\/script>)/gm,
  'cssExp': /(<link\s(?:.*)\$this->StaticUrl\([\'\"])([^\'\"\-]+)([\'\"]\)(?:[^\/]*)(?:\/?>|<\/link>))/gm
};
const fs = require('fs');

/**
 * 获取要合并的文件列表
 * @param content
 * @return [string]
 */
function getMergingFiles(content) {
  var ret = [], line;
  while (line = matchFlags.fileExp.exec(content)) {
    ret.push(line[1]);
  }
  return ret;
}

/**
 * 合并文件
 * @param files 要合并的文件
 * @param mergedName 合并后的文件
 * @param rootPath 根目录
 */
function mergeFiles(files, mergedName, rootPath) {
  var content = '';
  files.forEach(function (file) {
    var filepath = rootPath + file;
    if (fs.existsSync(filepath)) {
      content += '/* ' + file + "*/\n" + fs.readFileSync(filepath, "utf-8") + "\n";
    } else {
      console.log(filepath + " not exist");
    }
  });
  fs.writeFileSync(rootPath + mergedName, content, 'utf-8');
  return content;
}

module.exports = function (options) {
  options = options || {};
  var rootPath = options.rootPath || '';

  /**
   * 替换网址
   * @param all
   * @param seg1
   * @param url
   * @param seg2
   * @returns {*}
   */
  function replaceUrl(all, seg1, url, seg2){
    var filepath = rootPath + url;
    if (fs.existsSync(filepath)) {
      var md5sum = crypto.createHash('md5');
      md5sum.update(fs.readFileSync(filepath));
      var md5 = md5sum.digest('hex');

      var info = path.parse(url);
      url = info.dir + '/' + info.name + '-' + md5.substr(0, matchFlags.hashLength) + info.ext;
      return seg1 + url + seg2;
    }
    return all;
  }

  return through.obj(function (file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }
    if (!file.isBuffer()) {
      throw new Error('file must be buffer');
    }
    var content = new String(file.contents);
    var start = 0;
    var replaces = [];

    while (true) {
      var pos1 = content.indexOf(matchFlags.leftFlag, start);
      if (pos1 == -1) {
        break;
      }
      pos1 += 8;
      var pos2 = content.indexOf(matchFlags.rightFlag, pos1);
      if (pos2 == -1) {
        break;
      }
      var flag = content.substr(pos1, pos2 - pos1);
      var arr = flag.split(/\s+/);
      if (arr.length != 2) {
        break;
      }

      var mergedId = arr[0];
      mergedName = arr[1];
      // 寻找闭合标签
      var closedMatcher = matchFlags.leftFlag + mergedId + matchFlags.rightFlag;
      var pos3 = content.indexOf(closedMatcher, pos2 + 4);
      if (pos3 === -1) {
        start = pos2;
        continue;
      }

      // 找到闭合标签后，对中间的内容进行处理
      pos2 += 4;
      var files = getMergingFiles(content.substr(pos2, pos3 - pos2));
      var mergedContent = mergeFiles(files, mergedName, rootPath);
      // 修改html代码
      // console.log("write finish: " + rootPath + mergedName);

      var md5sum = crypto.createHash('md5');
      md5sum.update(mergedContent);

      pos3 += closedMatcher.length

      replaces.push({
        'start': pos1 - 8,
        'end': pos3,
        'type': path.extname(mergedName).substr(1).toLowerCase(),
        'path': mergedName,
        'stamp': md5sum.digest('hex')
      });
      start = pos3;
    }

    var changed = false;
    // 对内容进行替换
    for (var i = replaces.length - 1; i >= 0; i--) {
      var rep = replaces[i], repStr, newPath;
      var info = path.parse(rep.path);
      newPath = matchFlags.newPath
        .replace('{$base}', info.dir + '/' + info.name)
        .replace('{$ext}', info.ext)
        .replace('{$stamp}', rep.stamp.substr(0, matchFlags.hashLength));

      if (rep.type == 'js') {
        repStr = '<script src="' + newPath + '"></script>';
      } else if (rep.type == 'css') {
        repStr = '<link rel="stylesheet" type="text/css" href="' + newPath + '"/>';
      }
      content = content.substr(0, rep.start) + repStr + "\n" + content.substr(rep.end);
    }

    // 对剩余的js或样式进行替换
    var newContent = content
      .replace(matchFlags.jsExp, replaceUrl)
      .replace(matchFlags.cssExp, replaceUrl);
    if (replaces.length || newContent != content) {
      file.contents = new Buffer(newContent);
    }

    this.push(file);
    callback();
  });
};
