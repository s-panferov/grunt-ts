/// <reference path="../../defs/tsd.d.ts"/>

import _ = require('lodash');
import fs = require('fs');
import path = require('path');
import os = require('os');

import utils = require('./utils');

var eol = os.EOL;


/////////////////////////////////////////////////////////////////////
// AngularJS templateCache
////////////////////////////////////////////////////////////////////

// templateCache processing function

export function generateTemplateCache(src: string[], dest: string, basePath: string) {
    if (!src.length) {
        return;
    }

    // Resolve the relative path from basePath to each src file
    var relativePaths: string[] = _.map(src, (anHtmlFile) => 'text!' + utils.makeRelativePath(basePath, anHtmlFile));
    var fileNames: string[] = _.map(src, (anHtmlFile) => path.basename(anHtmlFile));
    var fileVarialbeName = (anHtmlFile) => anHtmlFile.split('.').join('_').split('-').join('_');
    var fileVariableNames: string[] = _.map(fileNames, fileVarialbeName);


    var templateCacheTemplate = _.template('// You must have requirejs + text plugin loaded for this to work.'
        + eol + 'define([<%=relativePathSection%>],function(<%=fileNameVariableSection%>){'
        + eol + 'angular.module("ng").run(["$templateCache",function($templateCache) {'
        + eol + '<%=templateCachePut%>'
        + eol + '}]);'
        + eol + '});');

    var relativePathSection = '"' + relativePaths.join('",' + eol + '"') + '"';
    var fileNameVariableSection = fileVariableNames.join(',' + eol);

    var templateCachePutTemplate = _.template('$templateCache.put("<%= fileName %>", <%=fileVariableName%>);');
    var templateCachePut = _.map(fileNames, (fileName) => templateCachePutTemplate({
        fileName: fileName,
        fileVariableName: fileVarialbeName(fileName)
    })).join(eol);

    var fileContent = templateCacheTemplate({
        relativePathSection: relativePathSection,
        fileNameVariableSection: fileNameVariableSection,
        templateCachePut: templateCachePut
    });

    // Early exit if new templateCache doesn't change
    if (fs.existsSync(dest)) {
        var originalContents = fs.readFileSync(dest).toString();
        if (originalContents === fileContent) {
            return;
        }
    }

    // write updated contents
    fs.writeFileSync(dest, fileContent);
}
