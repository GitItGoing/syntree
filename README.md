This project is a fork of https://github.com/mshang/syntree. The original description and relevant links can be found below.

This fork makes a couple of small changes:

* Brackets can be escaped using a backslash so that they appear in the output image and are not treated as part of the tree structure (This was adopted from [this](https://github.com/mshang/syntree/pull/22) pull request on the original repo).
* Support for non-numeric subscripts, e.g. for indicating traces.
___________________________________________________________

The goal of this project is to create a browser-based, fully local syntax tree generator, for drawing trees as you might find in an introductory linguistics course. Here are a few main features:

* Designed to be easy to use.
* Draws as you type for real-time feedback.
* Basic support for movement arrows using markup.
* Supports Unicode insofar as the browser it is running on does.
* Adjustable appearance.
* Linkable, i.e. parses the query string.

For more details, see the [wiki](https://github.com/mshang/syntree/wiki).

The app can be found at <http://mshang.ca/syntree/>. If you publish a paper with a tree drawn by this app, I would appreciate it if you sent me a link to your paper.

By the way, here are a few great alternatives:

* [phpSyntaxTree](http://ironcreek.net/phpsyntaxtree/)
* [RSyntaxTree](http://www.yohasebe.com/rsyntaxtree/)
