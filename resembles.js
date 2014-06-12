#!/usr/bin/env node
// Core node modules.
var fs = require('fs'),
    exec = require('child_process').exec,
    url = require('url');

// NPM Packages.
var program = require('commander'),
    phantom = require('phantom'),
    resemble = require('resemble');

program
  .version('0.0.1')
  .option('-d, --dimensions <size>', 'The dimensions to use for the viewport (default: 2550x1680) ')
  .option('-o, --output <output>', 'The directory to use to save the image files. (default: /tmp)')
  .option('-p, --port <port>', 'The port to use for PhantomJS')
  .parse(process.argv);


// Check to make sure we have two paths as arguments and if not show help text and exit.
if (program.args.length !== 2) {
  console.error('Please specify two paths for comparision!');
  program.help();
  process.exit(1);
}

// Make sure the urls provided are valid.
var firstUrl = program.args[0];
var secondUrl = program.args[1];

// Make sure our output directory is writeable, or fail early.
var outputDirectory = program.output || '/tmp';
if (!fs.existsSync(outputDirectory)) {
  console.error('Please make sure %s exists and is writeable, or specify another output directory.', outputDirectory);
  process.exit(1);
}

// Make sure PhantomJS is installed correctly.
exec('which phantomjs', function(err, stdout) {
  if (err) {
    console.error("phantomjs doesn't appear to be available in your path. Please `brew install phantomjs` or the equivalent for your system.");
    process.exit(1);
  }

  // If we have two paths, and phantomjs good to go take some screenshots.
  var port = program.port || 12345;
  var firstUrlImage = outputDirectory + '/' + firstUrl.replace('http://', '').replace('/', '_') + '.png';
  var secondUrlImage = outputDirectory + '/' + secondUrl.replace('http://', '').replace('/', '_') + '.png';
  var diffImagePath = outputDirectory + '/diff.png';
  // We need to split the output dimensions by width and height.
  var outputDimensions = program.dimensions || '2550x1880';
  var dimensions = outputDimensions.split('x');
  var viewportWidth = dimensions[0];
  var viewportHeight = dimensions[1];


  // Make sure the paths are proper urls, or normalize them.
  if (url.parse(firstUrl).host === null) {
    // Try adding an 'http://' to the url to see if that works.
    if (url.parse('http://' + firstUrl).host !== null) {
      firstUrl = 'http://' + firstUrl;
    }
    else {
      console.error('%s is not a valid url', firstUrl);
      process.exit(1);
    }
  }
  if (url.parse(secondUrl).host === null) {
    // Try adding an 'http://' to the url to see if that works.
    if (url.parse('http://' + secondUrl).host !== null) {
      secondUrl = 'http://' + secondUrl;
    }
    else {
      console.error('%s is not a valid url', secondUrl);
      process.exit(1);
    }
  }

  phantom.create('--web-security=no', '--ignore-ssl-errors=yes', { "port": port }, function(ph) {
    console.log('PhantomJS Browser started.');

    ph.createPage(function(page) {
      page.open(firstUrl, function(status) {
        if (status == 'success') {
          page.set('viewportSize', { width: viewportWidth, height: viewportHeight }, function(status) {
            page.render(firstUrlImage, function(err, status) {
              console.log(firstUrl + ' captured.');

              // Now get the image for the second site.
              page.open(secondUrl, function(status) {
                page.set('viewportSize', { width: viewportWidth, height: viewportHeight }, function(status) {
                  page.render(secondUrlImage, function(err, status) {
                    console.log(secondUrl + ' captured.');
                    // Close our page.
                    page.close();
                    // Exit PhantomJS
                    ph.exit();
                    // Generate our diff image with resemble.
                    resemble.resemble(firstUrlImage).compareTo(secondUrlImage).ignoreNothing().onComplete(function(data) {
                      var diffImage = data.getImageDataUrl().replace(/^data:image\/png;base64,/,"");

                      // Write the diff file to disk.
                      fs.writeFile(diffImagePath, diffImage, 'base64', function(err) {
                        if (err) throw err;

                        console.log('Your diff has been saved to %s', diffImagePath);
                      });
                    });
                  });
                });
              });
            });
          });
        }
      });
    });
  });
});
