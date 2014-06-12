# Installation

This package assumes you have phantomjs installed, and available in your path.
If that is not the case [follow their installation instructions](http://phantomjs.org/download.html).

After checking out this repository, and running ```npm install``` you can either make ```resembles``` executable or use ```node resembles``` to run the utility.

NOTE: This package also [requires a patch](https://github.com/kpdecker/node-resemble/pull/1) to the [resemble](https://www.npmjs.org/package/resemble) node module to allow the use of outputSettings.


# Usage

```resembles [options] path1 path2```

  Options:

	-h, --help			   output usage information
	-V, --version			output the version number
	-d, --dimensions <size>  The dimensions to use for the viewport (default: 2550x1680) 
	-o, --output <output>	The directory to use to save the image files. (default: os.tmpdir())
	-p, --port <port>		The port to use for PhantomJS



