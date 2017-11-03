#!/bin/bash
cd dist
for i in */; do zip -r "${i%/}.zip" "$i"; done
