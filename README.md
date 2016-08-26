# gulp-ya-merge

`gulp-ya-merge`并不用来压缩静态文件,而是用于在静态文件被压缩后,对html页面引用的的静态文件进行合并和追加文件版本等操作。

## 用法
```js
var destDir = "dist";
var merge = require('gulp-ya-merge');
var options = {
  rootPath: process.cwd() + '/share/static/'
};

gulp.task('merge', function () {
  gulp.src('mall/**/*.phtml')
    .pipe(merge(options))
    .pipe(gulp.dest('/dest/mall/'));
});
```

## 选项
`gulp-ya-merge`可传入一个对象作为参数,选项的可选值如下：

|  参数         | 说明                                                                                     |       默认值  |
|--------------|-----------------------------------------------------------------------------------------|--------------|
| `rootPath`   | 静态文件的根目录                                                                           | 当前目录       |
| `leftFlag`   | 合并区间代码的起始标识                                                                      | <!--min[      |
| `rightFlag`  | 合并区间代码的结束标识                                                                      | ]-->          |
| `newPath`    | 合并后要替换的地址。{$base}代表目录及文件名（不包括后缀），{$stamp}代表文件版本号，{$ext}代表文件的后缀 | <?=$this->StaticUrl(\'{$base}-{$stamp}{$ext}\')?> |
| `hashLength` | 文件版本号的长度                                                                           | 8              |
| `scriptExp`  | 要替换的非合并的script标签的正则表达式                                                        | /(<script\s(?:.*)\$this->StaticUrl\([\'\"])([^\'\"\-]+)([\'\"]\)(?:[^\/]*)><\/script>)/gm |
| `linkExp`    | 要替换的非合并的link标签的正则表达式                                                          | /(<link\s(?:.*)\$this->StaticUrl\([\'\"])([^\'\"\-]+)([\'\"]\)(?:[^\/]*)(?:\/?>|<\/link>))/gm |


需要注意的是：
`scriptExp`和`linkExp`需要包括3对小括号，第1对小括号表示静态文件前面的匹配内容，第2对小括号表示静态文件的网址，第3对小括号表示静态文件后面的匹配内容。

## 语法规则

下面用${xxx}表示上面的配置项,归结html代码的规则如下:
```html
{$leftFlag}{$flag1} {$destPath1}.js{$rightFlag}
{scriptExp}
{$leftFlag}{$flag1}{$rightFlag}

{$leftFlag}{$flag2} {$destPath2}.css{$rightFlag}
{linkExp}
{$leftFlag}{$flag2}{$rightFlag}

{$scriptExp}
{$linkExp}
```

最后将变成如下的代码:
```html
<script src="{$destPath1}-{$stamp1}.js"></script>
<link rel="stylesheet" type="text/css" href="{$destPath2}-{$stamp2}.css"/>
<script src="{$newPath1}"></script>
<link rel="stylesheet" type="text/css" href="{$newPath1}"/>
```



## 示例
```php
<link rel="shortcut icon" type="image/x-icon" href="<?= $this->StaticUrl('/static/favicon.ico') ?>"/>
<?php if (isset($this->v['mobileUrl'])): ?>
    <meta name="mobile-agent" content="format=html5; url=<?= $this->v['mobileUrl'] ?>"/>
<?php endif ?>
<?php if (isset($this->v['is_seo_tag']) && !empty($this->v['is_seo_tag'])): ?>
    <!-- <meta name="robots" content="nofollow">-->
<?php endif; ?>
<!--min[style /static/css/jiehun.n.min.css]-->
<link href="<?= $this->StaticUrl('/static/css/reset.css') ?>" rel="stylesheet" type="text/css"/>
<link href="<?= $this->StaticUrl('/static/css/grid.css') ?>" rel="stylesheet" type="text/css"/>
<link href="<?= $this->StaticUrl('/static/css/common.css') ?>" rel="stylesheet" type="text/css"/>
<link href="<?= $this->StaticUrl('/static/css/layout.css') ?>" rel="stylesheet" type="text/css"/>
<link href="<?= $this->StaticUrl('/static/css/class.css') ?>" rel="stylesheet" type="text/css"/>
<!--min[style]-->
<!--min[hapj /static/js/hapj.n.min.js]-->
<script src="<?= $this->StaticUrl('/static/js/jquery.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/js/hapj.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/js/ui/switchable.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/js/ui/verifiable.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/js/ui/floatable.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/js/ui/menuable.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/js/ui/ajaxable.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/js/ui/dialog.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/js/ui/selectable.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/js/ui/cal.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/js/ui/lazyload.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/js/ui/sortable.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/js/mod/adorn.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/hapj.conf.js') ?>"></script>
<script src="<?= $this->StaticUrl('/static/js/hapj.hook.js') ?>"></script>
<!--min[hapj]-->
```

经过`gulp-ya-merge`的处理，最后变成了如下代码：
  
```php
<link rel="shortcut icon" type="image/x-icon" href="<?= $this->StaticUrl('/static/favicon-ba5c0613.ico') ?>"/>
<?php if (isset($this->v['mobileUrl'])): ?>
    <meta name="mobile-agent" content="format=html5; url=<?= $this->v['mobileUrl'] ?>"/>
<?php endif ?>
<?php if (isset($this->v['is_seo_tag']) && !empty($this->v['is_seo_tag'])): ?>
    <!-- <meta name="robots" content="nofollow">-->
<?php endif; ?>
<link rel="stylesheet" type="text/css" href="<?=$this->StaticUrl('/static/css/jiehun.n.min-d41d8cd9.css')?>"/>
<script src="<?=$this->StaticUrl('/static/js/hapj.n.min-d41d8cd9.js')?>"></script>
```
