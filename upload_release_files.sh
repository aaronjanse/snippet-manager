#!/bin/bash

# $1 is the tag

cd dist

echo 'started mac ...'

github-release upload -u aaronduino -r snippet-manager \
-t $1 \
-n 'mac.zip' \
-f CodeSnippets-darwin-x64.zip

echo 'started win32-ia32 ...'

github-release upload -u aaronduino -r snippet-manager \
-t $1 \
-n 'win32-ia32.zip' \
-f CodeSnippets-win32-ia32.zip

echo 'started win32-x64 ...'

github-release upload -u aaronduino -r snippet-manager \
-t $1 \
-n 'win32-x64.zip' \
-f CodeSnippets-win32-x64.zip

echo 'started linux-ia32 ...'

github-release upload -u aaronduino -r snippet-manager \
-t $1 \
-n 'linux-ia32.zip' \
-f CodeSnippets-linux-ia32.zip

echo 'started linux-armv7l ...'

github-release upload -u aaronduino -r snippet-manager \
-t $1 \
-n 'linux-armv7l.zip' \
-f CodeSnippets-linux-armv7l.zip

echo 'finished'
