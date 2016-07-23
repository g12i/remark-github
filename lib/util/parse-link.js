/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:github:util:parse-link
 * @fileoverview Parse a link to GH.
 */

'use strict';

/* Dependencies. */
var toString = require('mdast-util-to-string');
var usernameEnd = require('./username-end');
var issueEnd = require('./issue-end');
var shaEnd = require('./sha-end');

/* Expose. */
module.exports = exports = parse;

exports.COMMIT = 'commit';
exports.ISSUE = 'issues';
exports.PULL = 'pull';

/* Constants. */
var GH_URL_PREFIX = 'https://github.com/';
var GH_URL_PREFIX_LENGTH = GH_URL_PREFIX.length;

/* Character codes. */
var CC_SLASH = '/'.charCodeAt(0);
var CC_HASH = '#'.charCodeAt(0);

/**
 * Parse a link and determine whether it links to GitHub.
 *
 * @param {LinkNode} node - Link node.
 * @return {Object?} - Information.
 */
function parse(node) {
  var link = {};
  var url = node.url || /* istanbul ignore next - remark@<4.0.0 */ node.href;
  var start;
  var end;
  var page;

  if (
    url.slice(0, GH_URL_PREFIX_LENGTH) !== GH_URL_PREFIX ||
    node.children.length !== 1 ||
    node.children[0].type !== 'text' ||
    toString(node).slice(0, GH_URL_PREFIX_LENGTH) !== GH_URL_PREFIX
  ) {
    return;
  }

  start = GH_URL_PREFIX_LENGTH;
  end = usernameEnd(url, GH_URL_PREFIX_LENGTH);

  if (end === -1 || url.charCodeAt(end) !== CC_SLASH) {
    return;
  }

  link.user = url.slice(start, end);

  start = end + 1;
  end = usernameEnd(url, start);

  if (end === -1 || url.charCodeAt(end) !== CC_SLASH) {
    return;
  }

  link.project = url.slice(start, end);

  start = end + 1;
  end = url.indexOf('/', start);

  if (end === -1) {
    return;
  }

  page = url.slice(start, end);

  if (page !== parse.COMMIT && page !== parse.ISSUE && page !== parse.PULL) {
    return;
  }

  link.page = page;
  start = end + 1;

  if (page === parse.COMMIT) {
    end = shaEnd(url, start, true);
  } else {
    end = issueEnd(url, start);
  }

  if (end === -1) {
    return;
  }

  link.reference = url.slice(start, end);
  link.comment = url.charCodeAt(end) === CC_HASH &&
    url.length > end + 1;

  return link;
}