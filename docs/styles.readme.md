styles.cssはlessのmixins機能を用いてstyles.lessとbootstrap.cssとを混合して生成します。
sytles.cssは自動生成されるファイルですので直接編集しません。
styles.lessを編集した後ここに記載した方法で生成します。

# styles.lessからstyles.cssをcompile(自動生成)する

参考:
[Command-line With Rhino](http://lesscss.org/#command-line-with-rhino)

```
$ java -jar tools/less/js.jar -f tools/less/less-rhino-1.7.5.js tools/less/lessc-rhino-1.7.5.js res/less/styles.less css/styles.css
```


# compileツール実行環境準備

必要なファイルは現在tools/lessにコミットしていますのでjava8環境のみ有ればよいですが、参考に導入手順を記載しておきます。
Java8, Nashorn, less1.7.5 の前提です。

参考:
[Java8でRhinoエンジンでJavaScriptを実行する準備 - Qiita](http://qiita.com/hrkt/items/d218dbb04e2392dbb314)

 - java8をインストールする
 - [Using Rhino JSR-223 engine with JDK8 - Nashorn -&nbsp;OpenJDK Wiki](https://wiki.openjdk.java.net/display/Nashorn/Using+Rhino+JSR-223+engine+with+JDK8)のサイトにあるpre-builtバイナリ rhino1_7R4.zip をダウンロードし, 中にある js.jar を取得する
 - [less.js v1.7.5](https://github.com/less/less.js/tree/v1.7.5) を取得する。 なお[v2系列はRhinoに未対応](https://github.com/less/less.js/issues/2316)です。


