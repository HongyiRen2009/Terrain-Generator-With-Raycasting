/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./models/stand.3mf":
/*!**************************!*\
  !*** ./models/stand.3mf ***!
  \**************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "3c4995c18eac9a702c1f.3mf";

/***/ }),

/***/ "./node_modules/gl-matrix/esm/common.js":
/*!**********************************************!*\
  !*** ./node_modules/gl-matrix/esm/common.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ARRAY_TYPE: () => (/* binding */ ARRAY_TYPE),
/* harmony export */   EPSILON: () => (/* binding */ EPSILON),
/* harmony export */   RANDOM: () => (/* binding */ RANDOM),
/* harmony export */   equals: () => (/* binding */ equals),
/* harmony export */   setMatrixArrayType: () => (/* binding */ setMatrixArrayType),
/* harmony export */   toRadian: () => (/* binding */ toRadian)
/* harmony export */ });
/**
 * Common utilities
 * @module glMatrix
 */
// Configuration Constants
var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
var RANDOM = Math.random;
/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Float32ArrayConstructor | ArrayConstructor} type Array type, such as Float32Array or Array
 */

function setMatrixArrayType(type) {
  ARRAY_TYPE = type;
}
var degree = Math.PI / 180;
/**
 * Convert Degree To Radian
 *
 * @param {Number} a Angle in Degrees
 */

function toRadian(a) {
  return a * degree;
}
/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 *
 * @param {Number} a The first number to test.
 * @param {Number} b The second number to test.
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */

function equals(a, b) {
  return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
}
if (!Math.hypot) Math.hypot = function () {
  var y = 0,
      i = arguments.length;

  while (i--) {
    y += arguments[i] * arguments[i];
  }

  return Math.sqrt(y);
};

/***/ }),

/***/ "./node_modules/gl-matrix/esm/mat4.js":
/*!********************************************!*\
  !*** ./node_modules/gl-matrix/esm/mat4.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   add: () => (/* binding */ add),
/* harmony export */   adjoint: () => (/* binding */ adjoint),
/* harmony export */   clone: () => (/* binding */ clone),
/* harmony export */   copy: () => (/* binding */ copy),
/* harmony export */   create: () => (/* binding */ create),
/* harmony export */   determinant: () => (/* binding */ determinant),
/* harmony export */   equals: () => (/* binding */ equals),
/* harmony export */   exactEquals: () => (/* binding */ exactEquals),
/* harmony export */   frob: () => (/* binding */ frob),
/* harmony export */   fromQuat: () => (/* binding */ fromQuat),
/* harmony export */   fromQuat2: () => (/* binding */ fromQuat2),
/* harmony export */   fromRotation: () => (/* binding */ fromRotation),
/* harmony export */   fromRotationTranslation: () => (/* binding */ fromRotationTranslation),
/* harmony export */   fromRotationTranslationScale: () => (/* binding */ fromRotationTranslationScale),
/* harmony export */   fromRotationTranslationScaleOrigin: () => (/* binding */ fromRotationTranslationScaleOrigin),
/* harmony export */   fromScaling: () => (/* binding */ fromScaling),
/* harmony export */   fromTranslation: () => (/* binding */ fromTranslation),
/* harmony export */   fromValues: () => (/* binding */ fromValues),
/* harmony export */   fromXRotation: () => (/* binding */ fromXRotation),
/* harmony export */   fromYRotation: () => (/* binding */ fromYRotation),
/* harmony export */   fromZRotation: () => (/* binding */ fromZRotation),
/* harmony export */   frustum: () => (/* binding */ frustum),
/* harmony export */   getRotation: () => (/* binding */ getRotation),
/* harmony export */   getScaling: () => (/* binding */ getScaling),
/* harmony export */   getTranslation: () => (/* binding */ getTranslation),
/* harmony export */   identity: () => (/* binding */ identity),
/* harmony export */   invert: () => (/* binding */ invert),
/* harmony export */   lookAt: () => (/* binding */ lookAt),
/* harmony export */   mul: () => (/* binding */ mul),
/* harmony export */   multiply: () => (/* binding */ multiply),
/* harmony export */   multiplyScalar: () => (/* binding */ multiplyScalar),
/* harmony export */   multiplyScalarAndAdd: () => (/* binding */ multiplyScalarAndAdd),
/* harmony export */   ortho: () => (/* binding */ ortho),
/* harmony export */   orthoNO: () => (/* binding */ orthoNO),
/* harmony export */   orthoZO: () => (/* binding */ orthoZO),
/* harmony export */   perspective: () => (/* binding */ perspective),
/* harmony export */   perspectiveFromFieldOfView: () => (/* binding */ perspectiveFromFieldOfView),
/* harmony export */   perspectiveNO: () => (/* binding */ perspectiveNO),
/* harmony export */   perspectiveZO: () => (/* binding */ perspectiveZO),
/* harmony export */   rotate: () => (/* binding */ rotate),
/* harmony export */   rotateX: () => (/* binding */ rotateX),
/* harmony export */   rotateY: () => (/* binding */ rotateY),
/* harmony export */   rotateZ: () => (/* binding */ rotateZ),
/* harmony export */   scale: () => (/* binding */ scale),
/* harmony export */   set: () => (/* binding */ set),
/* harmony export */   str: () => (/* binding */ str),
/* harmony export */   sub: () => (/* binding */ sub),
/* harmony export */   subtract: () => (/* binding */ subtract),
/* harmony export */   targetTo: () => (/* binding */ targetTo),
/* harmony export */   translate: () => (/* binding */ translate),
/* harmony export */   transpose: () => (/* binding */ transpose)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common.js */ "./node_modules/gl-matrix/esm/common.js");

/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */

function create() {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(16);

  if (_common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }

  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}
/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */

function clone(a) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(16);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Create a new mat4 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} A new mat4
 */

function fromValues(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(16);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}
/**
 * Set the components of a mat4 to the given values
 *
 * @param {mat4} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} out
 */

function set(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}
/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */

function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    var a12 = a[6],
        a13 = a[7];
    var a23 = a[11];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a01;
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a02;
    out[9] = a12;
    out[11] = a[14];
    out[12] = a03;
    out[13] = a13;
    out[14] = a23;
  } else {
    out[0] = a[0];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a[1];
    out[5] = a[5];
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a[2];
    out[9] = a[6];
    out[10] = a[10];
    out[11] = a[14];
    out[12] = a[3];
    out[13] = a[7];
    out[14] = a[11];
    out[15] = a[15];
  }

  return out;
}
/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function invert(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return null;
  }

  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}
/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function adjoint(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
  out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
  out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
  out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
  out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
  out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
  out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
  out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
  out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
  out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
  out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
  out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
  out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
  out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
  out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
  out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
  return out;
}
/**
 * Calculates the determinant of a mat4
 *
 * @param {ReadonlyMat4} a the source matrix
 * @returns {Number} determinant of a
 */

function determinant(a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}
/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function multiply(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15]; // Cache only the current line of the second matrix

  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}
/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {mat4} out
 */

function translate(out, a, v) {
  var x = v[0],
      y = v[1],
      z = v[2];
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;

  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;
    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }

  return out;
}
/**
 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {ReadonlyVec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/

function scale(out, a, v) {
  var x = v[0],
      y = v[1],
      z = v[2];
  out[0] = a[0] * x;
  out[1] = a[1] * x;
  out[2] = a[2] * x;
  out[3] = a[3] * x;
  out[4] = a[4] * y;
  out[5] = a[5] * y;
  out[6] = a[6] * y;
  out[7] = a[7] * y;
  out[8] = a[8] * z;
  out[9] = a[9] * z;
  out[10] = a[10] * z;
  out[11] = a[11] * z;
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */

function rotate(out, a, rad, axis) {
  var x = axis[0],
      y = axis[1],
      z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  var b00, b01, b02;
  var b10, b11, b12;
  var b20, b21, b22;

  if (len < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;
  a00 = a[0];
  a01 = a[1];
  a02 = a[2];
  a03 = a[3];
  a10 = a[4];
  a11 = a[5];
  a12 = a[6];
  a13 = a[7];
  a20 = a[8];
  a21 = a[9];
  a22 = a[10];
  a23 = a[11]; // Construct the elements of the rotation matrix

  b00 = x * x * t + c;
  b01 = y * x * t + z * s;
  b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;
  b11 = y * y * t + c;
  b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;
  b21 = y * z * t - x * s;
  b22 = z * z * t + c; // Perform rotation-specific matrix multiplication

  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22;

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  return out;
}
/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function rotateX(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}
/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function rotateY(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}
/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function rotateZ(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}
/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */

function fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Scaling vector
 * @returns {mat4} out
 */

function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a given angle around a given axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotate(dest, dest, rad, axis);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */

function fromRotation(out, rad, axis) {
  var x = axis[0],
      y = axis[1],
      z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;

  if (len < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c; // Perform rotation-specific matrix multiplication

  out[0] = x * x * t + c;
  out[1] = y * x * t + z * s;
  out[2] = z * x * t - y * s;
  out[3] = 0;
  out[4] = x * y * t - z * s;
  out[5] = y * y * t + c;
  out[6] = z * y * t + x * s;
  out[7] = 0;
  out[8] = x * z * t + y * s;
  out[9] = y * z * t - x * s;
  out[10] = z * z * t + c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the X axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateX(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function fromXRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = c;
  out[6] = s;
  out[7] = 0;
  out[8] = 0;
  out[9] = -s;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the Y axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateY(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function fromYRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = c;
  out[1] = 0;
  out[2] = -s;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = s;
  out[9] = 0;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the Z axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateZ(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function fromZRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = 0;
  out[4] = -s;
  out[5] = c;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */

function fromRotationTranslation(out, q, v) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - (yy + zz);
  out[1] = xy + wz;
  out[2] = xz - wy;
  out[3] = 0;
  out[4] = xy - wz;
  out[5] = 1 - (xx + zz);
  out[6] = yz + wx;
  out[7] = 0;
  out[8] = xz + wy;
  out[9] = yz - wx;
  out[10] = 1 - (xx + yy);
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a new mat4 from a dual quat.
 *
 * @param {mat4} out Matrix
 * @param {ReadonlyQuat2} a Dual Quaternion
 * @returns {mat4} mat4 receiving operation result
 */

function fromQuat2(out, a) {
  var translation = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);
  var bx = -a[0],
      by = -a[1],
      bz = -a[2],
      bw = a[3],
      ax = a[4],
      ay = a[5],
      az = a[6],
      aw = a[7];
  var magnitude = bx * bx + by * by + bz * bz + bw * bw; //Only scale if it makes sense

  if (magnitude > 0) {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
  } else {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  }

  fromRotationTranslation(out, a, translation);
  return out;
}
/**
 * Returns the translation vector component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslation,
 *  the returned vector will be the same as the translation vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive translation component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */

function getTranslation(out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];
  return out;
}
/**
 * Returns the scaling factor component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslationScale
 *  with a normalized Quaternion paramter, the returned vector will be
 *  the same as the scaling vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive scaling factor component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */

function getScaling(out, mat) {
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];
  out[0] = Math.hypot(m11, m12, m13);
  out[1] = Math.hypot(m21, m22, m23);
  out[2] = Math.hypot(m31, m32, m33);
  return out;
}
/**
 * Returns a quaternion representing the rotational component
 *  of a transformation matrix. If a matrix is built with
 *  fromRotationTranslation, the returned quaternion will be the
 *  same as the quaternion originally supplied.
 * @param {quat} out Quaternion to receive the rotation component
 * @param {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {quat} out
 */

function getRotation(out, mat) {
  var scaling = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);
  getScaling(scaling, mat);
  var is1 = 1 / scaling[0];
  var is2 = 1 / scaling[1];
  var is3 = 1 / scaling[2];
  var sm11 = mat[0] * is1;
  var sm12 = mat[1] * is2;
  var sm13 = mat[2] * is3;
  var sm21 = mat[4] * is1;
  var sm22 = mat[5] * is2;
  var sm23 = mat[6] * is3;
  var sm31 = mat[8] * is1;
  var sm32 = mat[9] * is2;
  var sm33 = mat[10] * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;

  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (sm23 - sm32) / S;
    out[1] = (sm31 - sm13) / S;
    out[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S;
    out[0] = 0.25 * S;
    out[1] = (sm12 + sm21) / S;
    out[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S;
    out[0] = (sm12 + sm21) / S;
    out[1] = 0.25 * S;
    out[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S;
    out[0] = (sm31 + sm13) / S;
    out[1] = (sm23 + sm32) / S;
    out[2] = 0.25 * S;
  }

  return out;
}
/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @returns {mat4} out
 */

function fromRotationTranslationScale(out, q, v, s) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     mat4.translate(dest, origin);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *     mat4.translate(dest, negativeOrigin);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @param {ReadonlyVec3} o The origin vector around which to scale and rotate
 * @returns {mat4} out
 */

function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  var ox = o[0];
  var oy = o[1];
  var oz = o[2];
  var out0 = (1 - (yy + zz)) * sx;
  var out1 = (xy + wz) * sx;
  var out2 = (xz - wy) * sx;
  var out4 = (xy - wz) * sy;
  var out5 = (1 - (xx + zz)) * sy;
  var out6 = (yz + wx) * sy;
  var out8 = (xz + wy) * sz;
  var out9 = (yz - wx) * sz;
  var out10 = (1 - (xx + yy)) * sz;
  out[0] = out0;
  out[1] = out1;
  out[2] = out2;
  out[3] = 0;
  out[4] = out4;
  out[5] = out5;
  out[6] = out6;
  out[7] = 0;
  out[8] = out8;
  out[9] = out9;
  out[10] = out10;
  out[11] = 0;
  out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
  out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
  out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
  out[15] = 1;
  return out;
}
/**
 * Calculates a 4x4 matrix from the given quaternion
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyQuat} q Quaternion to create matrix from
 *
 * @returns {mat4} out
 */

function fromQuat(out, q) {
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[1] = yx + wz;
  out[2] = zx - wy;
  out[3] = 0;
  out[4] = yx - wz;
  out[5] = 1 - xx - zz;
  out[6] = zy + wx;
  out[7] = 0;
  out[8] = zx + wy;
  out[9] = zy - wx;
  out[10] = 1 - xx - yy;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */

function frustum(out, left, right, bottom, top, near, far) {
  var rl = 1 / (right - left);
  var tb = 1 / (top - bottom);
  var nf = 1 / (near - far);
  out[0] = near * 2 * rl;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = near * 2 * tb;
  out[6] = 0;
  out[7] = 0;
  out[8] = (right + left) * rl;
  out[9] = (top + bottom) * tb;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near * 2 * nf;
  out[15] = 0;
  return out;
}
/**
 * Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */

function perspectiveNO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }

  return out;
}
/**
 * Alias for {@link mat4.perspectiveNO}
 * @function
 */

var perspective = perspectiveNO;
/**
 * Generates a perspective projection matrix suitable for WebGPU with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */

function perspectiveZO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = far * nf;
    out[14] = far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -near;
  }

  return out;
}
/**
 * Generates a perspective projection matrix with the given field of view.
 * This is primarily useful for generating projection matrices to be used
 * with the still experiemental WebVR API.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function perspectiveFromFieldOfView(out, fov, near, far) {
  var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
  var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
  var xScale = 2.0 / (leftTan + rightTan);
  var yScale = 2.0 / (upTan + downTan);
  out[0] = xScale;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  out[4] = 0.0;
  out[5] = yScale;
  out[6] = 0.0;
  out[7] = 0.0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[9] = (upTan - downTan) * yScale * 0.5;
  out[10] = far / (near - far);
  out[11] = -1.0;
  out[12] = 0.0;
  out[13] = 0.0;
  out[14] = far * near / (near - far);
  out[15] = 0.0;
  return out;
}
/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function orthoNO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}
/**
 * Alias for {@link mat4.orthoNO}
 * @function
 */

var ortho = orthoNO;
/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function orthoZO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = near * nf;
  out[15] = 1;
  return out;
}
/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];

  if (Math.abs(eyex - centerx) < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON && Math.abs(eyey - centery) < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON && Math.abs(eyez - centerz) < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON) {
    return identity(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.hypot(x0, x1, x2);

  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.hypot(y0, y1, y2);

  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;
  return out;
}
/**
 * Generates a matrix that makes something look at something else.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

function targetTo(out, eye, target, up) {
  var eyex = eye[0],
      eyey = eye[1],
      eyez = eye[2],
      upx = up[0],
      upy = up[1],
      upz = up[2];
  var z0 = eyex - target[0],
      z1 = eyey - target[1],
      z2 = eyez - target[2];
  var len = z0 * z0 + z1 * z1 + z2 * z2;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
    z0 *= len;
    z1 *= len;
    z2 *= len;
  }

  var x0 = upy * z2 - upz * z1,
      x1 = upz * z0 - upx * z2,
      x2 = upx * z1 - upy * z0;
  len = x0 * x0 + x1 * x1 + x2 * x2;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  out[0] = x0;
  out[1] = x1;
  out[2] = x2;
  out[3] = 0;
  out[4] = z1 * x2 - z2 * x1;
  out[5] = z2 * x0 - z0 * x2;
  out[6] = z0 * x1 - z1 * x0;
  out[7] = 0;
  out[8] = z0;
  out[9] = z1;
  out[10] = z2;
  out[11] = 0;
  out[12] = eyex;
  out[13] = eyey;
  out[14] = eyez;
  out[15] = 1;
  return out;
}
/**
 * Returns a string representation of a mat4
 *
 * @param {ReadonlyMat4} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */

function str(a) {
  return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
}
/**
 * Returns Frobenius norm of a mat4
 *
 * @param {ReadonlyMat4} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */

function frob(a) {
  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
}
/**
 * Adds two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  out[9] = a[9] + b[9];
  out[10] = a[10] + b[10];
  out[11] = a[11] + b[11];
  out[12] = a[12] + b[12];
  out[13] = a[13] + b[13];
  out[14] = a[14] + b[14];
  out[15] = a[15] + b[15];
  return out;
}
/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  out[9] = a[9] - b[9];
  out[10] = a[10] - b[10];
  out[11] = a[11] - b[11];
  out[12] = a[12] - b[12];
  out[13] = a[13] - b[13];
  out[14] = a[14] - b[14];
  out[15] = a[15] - b[15];
  return out;
}
/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat4} out
 */

function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  out[9] = a[9] * b;
  out[10] = a[10] * b;
  out[11] = a[11] * b;
  out[12] = a[12] * b;
  out[13] = a[13] * b;
  out[14] = a[14] * b;
  out[15] = a[15] * b;
  return out;
}
/**
 * Adds two mat4's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat4} out the receiving vector
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat4} out
 */

function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  out[6] = a[6] + b[6] * scale;
  out[7] = a[7] + b[7] * scale;
  out[8] = a[8] + b[8] * scale;
  out[9] = a[9] + b[9] * scale;
  out[10] = a[10] + b[10] * scale;
  out[11] = a[11] + b[11] * scale;
  out[12] = a[12] + b[12] * scale;
  out[13] = a[13] + b[13] * scale;
  out[14] = a[14] + b[14] * scale;
  out[15] = a[15] + b[15] * scale;
  return out;
}
/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var a4 = a[4],
      a5 = a[5],
      a6 = a[6],
      a7 = a[7];
  var a8 = a[8],
      a9 = a[9],
      a10 = a[10],
      a11 = a[11];
  var a12 = a[12],
      a13 = a[13],
      a14 = a[14],
      a15 = a[15];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  var b4 = b[4],
      b5 = b[5],
      b6 = b[6],
      b7 = b[7];
  var b8 = b[8],
      b9 = b[9],
      b10 = b[10],
      b11 = b[11];
  var b12 = b[12],
      b13 = b[13],
      b14 = b[14],
      b15 = b[15];
  return Math.abs(a0 - b0) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15));
}
/**
 * Alias for {@link mat4.multiply}
 * @function
 */

var mul = multiply;
/**
 * Alias for {@link mat4.subtract}
 * @function
 */

var sub = subtract;

/***/ }),

/***/ "./node_modules/gl-matrix/esm/vec2.js":
/*!********************************************!*\
  !*** ./node_modules/gl-matrix/esm/vec2.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   add: () => (/* binding */ add),
/* harmony export */   angle: () => (/* binding */ angle),
/* harmony export */   ceil: () => (/* binding */ ceil),
/* harmony export */   clone: () => (/* binding */ clone),
/* harmony export */   copy: () => (/* binding */ copy),
/* harmony export */   create: () => (/* binding */ create),
/* harmony export */   cross: () => (/* binding */ cross),
/* harmony export */   dist: () => (/* binding */ dist),
/* harmony export */   distance: () => (/* binding */ distance),
/* harmony export */   div: () => (/* binding */ div),
/* harmony export */   divide: () => (/* binding */ divide),
/* harmony export */   dot: () => (/* binding */ dot),
/* harmony export */   equals: () => (/* binding */ equals),
/* harmony export */   exactEquals: () => (/* binding */ exactEquals),
/* harmony export */   floor: () => (/* binding */ floor),
/* harmony export */   forEach: () => (/* binding */ forEach),
/* harmony export */   fromValues: () => (/* binding */ fromValues),
/* harmony export */   inverse: () => (/* binding */ inverse),
/* harmony export */   len: () => (/* binding */ len),
/* harmony export */   length: () => (/* binding */ length),
/* harmony export */   lerp: () => (/* binding */ lerp),
/* harmony export */   max: () => (/* binding */ max),
/* harmony export */   min: () => (/* binding */ min),
/* harmony export */   mul: () => (/* binding */ mul),
/* harmony export */   multiply: () => (/* binding */ multiply),
/* harmony export */   negate: () => (/* binding */ negate),
/* harmony export */   normalize: () => (/* binding */ normalize),
/* harmony export */   random: () => (/* binding */ random),
/* harmony export */   rotate: () => (/* binding */ rotate),
/* harmony export */   round: () => (/* binding */ round),
/* harmony export */   scale: () => (/* binding */ scale),
/* harmony export */   scaleAndAdd: () => (/* binding */ scaleAndAdd),
/* harmony export */   set: () => (/* binding */ set),
/* harmony export */   sqrDist: () => (/* binding */ sqrDist),
/* harmony export */   sqrLen: () => (/* binding */ sqrLen),
/* harmony export */   squaredDistance: () => (/* binding */ squaredDistance),
/* harmony export */   squaredLength: () => (/* binding */ squaredLength),
/* harmony export */   str: () => (/* binding */ str),
/* harmony export */   sub: () => (/* binding */ sub),
/* harmony export */   subtract: () => (/* binding */ subtract),
/* harmony export */   transformMat2: () => (/* binding */ transformMat2),
/* harmony export */   transformMat2d: () => (/* binding */ transformMat2d),
/* harmony export */   transformMat3: () => (/* binding */ transformMat3),
/* harmony export */   transformMat4: () => (/* binding */ transformMat4),
/* harmony export */   zero: () => (/* binding */ zero)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common.js */ "./node_modules/gl-matrix/esm/common.js");

/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */

function create() {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(2);

  if (_common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }

  return out;
}
/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {ReadonlyVec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */

function clone(a) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(2);
  out[0] = a[0];
  out[1] = a[1];
  return out;
}
/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */

function fromValues(x, y) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(2);
  out[0] = x;
  out[1] = y;
  return out;
}
/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the source vector
 * @returns {vec2} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  return out;
}
/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */

function set(out, x, y) {
  out[0] = x;
  out[1] = y;
  return out;
}
/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  return out;
}
/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  return out;
}
/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  return out;
}
/**
 * Math.ceil the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to ceil
 * @returns {vec2} out
 */

function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  return out;
}
/**
 * Math.floor the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to floor
 * @returns {vec2} out
 */

function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  return out;
}
/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  return out;
}
/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  return out;
}
/**
 * Math.round the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to round
 * @returns {vec2} out
 */

function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  return out;
}
/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */

function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  return out;
}
/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */

function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  return out;
}
/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} distance between a and b
 */

function distance(a, b) {
  var x = b[0] - a[0],
      y = b[1] - a[1];
  return Math.hypot(x, y);
}
/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} squared distance between a and b
 */

function squaredDistance(a, b) {
  var x = b[0] - a[0],
      y = b[1] - a[1];
  return x * x + y * y;
}
/**
 * Calculates the length of a vec2
 *
 * @param {ReadonlyVec2} a vector to calculate length of
 * @returns {Number} length of a
 */

function length(a) {
  var x = a[0],
      y = a[1];
  return Math.hypot(x, y);
}
/**
 * Calculates the squared length of a vec2
 *
 * @param {ReadonlyVec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */

function squaredLength(a) {
  var x = a[0],
      y = a[1];
  return x * x + y * y;
}
/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to negate
 * @returns {vec2} out
 */

function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  return out;
}
/**
 * Returns the inverse of the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to invert
 * @returns {vec2} out
 */

function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  return out;
}
/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to normalize
 * @returns {vec2} out
 */

function normalize(out, a) {
  var x = a[0],
      y = a[1];
  var len = x * x + y * y;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  return out;
}
/**
 * Calculates the dot product of two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} dot product of a and b
 */

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}
/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec3} out
 */

function cross(out, a, b) {
  var z = a[0] * b[1] - a[1] * b[0];
  out[0] = out[1] = 0;
  out[2] = z;
  return out;
}
/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec2} out
 */

function lerp(out, a, b, t) {
  var ax = a[0],
      ay = a[1];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  return out;
}
/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec2} out
 */

function random(out, scale) {
  scale = scale || 1.0;
  var r = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2.0 * Math.PI;
  out[0] = Math.cos(r) * scale;
  out[1] = Math.sin(r) * scale;
  return out;
}
/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2} m matrix to transform with
 * @returns {vec2} out
 */

function transformMat2(out, a, m) {
  var x = a[0],
      y = a[1];
  out[0] = m[0] * x + m[2] * y;
  out[1] = m[1] * x + m[3] * y;
  return out;
}
/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2d} m matrix to transform with
 * @returns {vec2} out
 */

function transformMat2d(out, a, m) {
  var x = a[0],
      y = a[1];
  out[0] = m[0] * x + m[2] * y + m[4];
  out[1] = m[1] * x + m[3] * y + m[5];
  return out;
}
/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat3} m matrix to transform with
 * @returns {vec2} out
 */

function transformMat3(out, a, m) {
  var x = a[0],
      y = a[1];
  out[0] = m[0] * x + m[3] * y + m[6];
  out[1] = m[1] * x + m[4] * y + m[7];
  return out;
}
/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec2} out
 */

function transformMat4(out, a, m) {
  var x = a[0];
  var y = a[1];
  out[0] = m[0] * x + m[4] * y + m[12];
  out[1] = m[1] * x + m[5] * y + m[13];
  return out;
}
/**
 * Rotate a 2D vector
 * @param {vec2} out The receiving vec2
 * @param {ReadonlyVec2} a The vec2 point to rotate
 * @param {ReadonlyVec2} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec2} out
 */

function rotate(out, a, b, rad) {
  //Translate point to the origin
  var p0 = a[0] - b[0],
      p1 = a[1] - b[1],
      sinC = Math.sin(rad),
      cosC = Math.cos(rad); //perform rotation and translate to correct position

  out[0] = p0 * cosC - p1 * sinC + b[0];
  out[1] = p0 * sinC + p1 * cosC + b[1];
  return out;
}
/**
 * Get the angle between two 2D vectors
 * @param {ReadonlyVec2} a The first operand
 * @param {ReadonlyVec2} b The second operand
 * @returns {Number} The angle in radians
 */

function angle(a, b) {
  var x1 = a[0],
      y1 = a[1],
      x2 = b[0],
      y2 = b[1],
      // mag is the product of the magnitudes of a and b
  mag = Math.sqrt(x1 * x1 + y1 * y1) * Math.sqrt(x2 * x2 + y2 * y2),
      // mag &&.. short circuits if mag == 0
  cosine = mag && (x1 * x2 + y1 * y2) / mag; // Math.min(Math.max(cosine, -1), 1) clamps the cosine between -1 and 1

  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}
/**
 * Set the components of a vec2 to zero
 *
 * @param {vec2} out the receiving vector
 * @returns {vec2} out
 */

function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  return out;
}
/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec2} a vector to represent as a string
 * @returns {String} string representation of the vector
 */

function str(a) {
  return "vec2(" + a[0] + ", " + a[1] + ")";
}
/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function equals(a, b) {
  var a0 = a[0],
      a1 = a[1];
  var b0 = b[0],
      b1 = b[1];
  return Math.abs(a0 - b0) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1));
}
/**
 * Alias for {@link vec2.length}
 * @function
 */

var len = length;
/**
 * Alias for {@link vec2.subtract}
 * @function
 */

var sub = subtract;
/**
 * Alias for {@link vec2.multiply}
 * @function
 */

var mul = multiply;
/**
 * Alias for {@link vec2.divide}
 * @function
 */

var div = divide;
/**
 * Alias for {@link vec2.distance}
 * @function
 */

var dist = distance;
/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */

var sqrDist = squaredDistance;
/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */

var sqrLen = squaredLength;
/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

var forEach = function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 2;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
    }

    return a;
  };
}();

/***/ }),

/***/ "./node_modules/gl-matrix/esm/vec3.js":
/*!********************************************!*\
  !*** ./node_modules/gl-matrix/esm/vec3.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   add: () => (/* binding */ add),
/* harmony export */   angle: () => (/* binding */ angle),
/* harmony export */   bezier: () => (/* binding */ bezier),
/* harmony export */   ceil: () => (/* binding */ ceil),
/* harmony export */   clone: () => (/* binding */ clone),
/* harmony export */   copy: () => (/* binding */ copy),
/* harmony export */   create: () => (/* binding */ create),
/* harmony export */   cross: () => (/* binding */ cross),
/* harmony export */   dist: () => (/* binding */ dist),
/* harmony export */   distance: () => (/* binding */ distance),
/* harmony export */   div: () => (/* binding */ div),
/* harmony export */   divide: () => (/* binding */ divide),
/* harmony export */   dot: () => (/* binding */ dot),
/* harmony export */   equals: () => (/* binding */ equals),
/* harmony export */   exactEquals: () => (/* binding */ exactEquals),
/* harmony export */   floor: () => (/* binding */ floor),
/* harmony export */   forEach: () => (/* binding */ forEach),
/* harmony export */   fromValues: () => (/* binding */ fromValues),
/* harmony export */   hermite: () => (/* binding */ hermite),
/* harmony export */   inverse: () => (/* binding */ inverse),
/* harmony export */   len: () => (/* binding */ len),
/* harmony export */   length: () => (/* binding */ length),
/* harmony export */   lerp: () => (/* binding */ lerp),
/* harmony export */   max: () => (/* binding */ max),
/* harmony export */   min: () => (/* binding */ min),
/* harmony export */   mul: () => (/* binding */ mul),
/* harmony export */   multiply: () => (/* binding */ multiply),
/* harmony export */   negate: () => (/* binding */ negate),
/* harmony export */   normalize: () => (/* binding */ normalize),
/* harmony export */   random: () => (/* binding */ random),
/* harmony export */   rotateX: () => (/* binding */ rotateX),
/* harmony export */   rotateY: () => (/* binding */ rotateY),
/* harmony export */   rotateZ: () => (/* binding */ rotateZ),
/* harmony export */   round: () => (/* binding */ round),
/* harmony export */   scale: () => (/* binding */ scale),
/* harmony export */   scaleAndAdd: () => (/* binding */ scaleAndAdd),
/* harmony export */   set: () => (/* binding */ set),
/* harmony export */   sqrDist: () => (/* binding */ sqrDist),
/* harmony export */   sqrLen: () => (/* binding */ sqrLen),
/* harmony export */   squaredDistance: () => (/* binding */ squaredDistance),
/* harmony export */   squaredLength: () => (/* binding */ squaredLength),
/* harmony export */   str: () => (/* binding */ str),
/* harmony export */   sub: () => (/* binding */ sub),
/* harmony export */   subtract: () => (/* binding */ subtract),
/* harmony export */   transformMat3: () => (/* binding */ transformMat3),
/* harmony export */   transformMat4: () => (/* binding */ transformMat4),
/* harmony export */   transformQuat: () => (/* binding */ transformQuat),
/* harmony export */   zero: () => (/* binding */ zero)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common.js */ "./node_modules/gl-matrix/esm/common.js");

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */

function create() {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);

  if (_common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  return out;
}
/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {ReadonlyVec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */

function clone(a) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */

function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.hypot(x, y, z);
}
/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */

function fromValues(x, y, z) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the source vector
 * @returns {vec3} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */

function set(out, x, y, z) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}
/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  return out;
}
/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  return out;
}
/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to ceil
 * @returns {vec3} out
 */

function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  return out;
}
/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to floor
 * @returns {vec3} out
 */

function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  return out;
}
/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  return out;
}
/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  return out;
}
/**
 * Math.round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to round
 * @returns {vec3} out
 */

function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  return out;
}
/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */

function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}
/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */

function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  return out;
}
/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} distance between a and b
 */

function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return Math.hypot(x, y, z);
}
/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} squared distance between a and b
 */

function squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return x * x + y * y + z * z;
}
/**
 * Calculates the squared length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */

function squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return x * x + y * y + z * z;
}
/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to negate
 * @returns {vec3} out
 */

function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  return out;
}
/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to invert
 * @returns {vec3} out
 */

function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  return out;
}
/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */

function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}
/**
 * Calculates the dot product of two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} dot product of a and b
 */

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function cross(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2];
  var bx = b[0],
      by = b[1],
      bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}
/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */

function lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  return out;
}
/**
 * Performs a hermite interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */

function hermite(out, a, b, c, d, t) {
  var factorTimes2 = t * t;
  var factor1 = factorTimes2 * (2 * t - 3) + 1;
  var factor2 = factorTimes2 * (t - 2) + t;
  var factor3 = factorTimes2 * (t - 1);
  var factor4 = factorTimes2 * (3 - 2 * t);
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}
/**
 * Performs a bezier interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */

function bezier(out, a, b, c, d, t) {
  var inverseFactor = 1 - t;
  var inverseFactorTimesTwo = inverseFactor * inverseFactor;
  var factorTimes2 = t * t;
  var factor1 = inverseFactorTimesTwo * inverseFactor;
  var factor2 = 3 * t * inverseFactorTimesTwo;
  var factor3 = 3 * factorTimes2 * inverseFactor;
  var factor4 = factorTimes2 * t;
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}
/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */

function random(out, scale) {
  scale = scale || 1.0;
  var r = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2.0 * Math.PI;
  var z = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2.0 - 1.0;
  var zScale = Math.sqrt(1.0 - z * z) * scale;
  out[0] = Math.cos(r) * zScale;
  out[1] = Math.sin(r) * zScale;
  out[2] = z * scale;
  return out;
}
/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec3} out
 */

function transformMat4(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}
/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat3} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */

function transformMat3(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  out[0] = x * m[0] + y * m[3] + z * m[6];
  out[1] = x * m[1] + y * m[4] + z * m[7];
  out[2] = x * m[2] + y * m[5] + z * m[8];
  return out;
}
/**
 * Transforms the vec3 with a quat
 * Can also be used for dual quaternions. (Multiply it with the real part)
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyQuat} q quaternion to transform with
 * @returns {vec3} out
 */

function transformQuat(out, a, q) {
  // benchmarks: https://jsperf.com/quaternion-transform-vec3-implementations-fixed
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3];
  var x = a[0],
      y = a[1],
      z = a[2]; // var qvec = [qx, qy, qz];
  // var uv = vec3.cross([], qvec, a);

  var uvx = qy * z - qz * y,
      uvy = qz * x - qx * z,
      uvz = qx * y - qy * x; // var uuv = vec3.cross([], qvec, uv);

  var uuvx = qy * uvz - qz * uvy,
      uuvy = qz * uvx - qx * uvz,
      uuvz = qx * uvy - qy * uvx; // vec3.scale(uv, uv, 2 * w);

  var w2 = qw * 2;
  uvx *= w2;
  uvy *= w2;
  uvz *= w2; // vec3.scale(uuv, uuv, 2);

  uuvx *= 2;
  uuvy *= 2;
  uuvz *= 2; // return vec3.add(out, a, vec3.add(out, uv, uuv));

  out[0] = x + uvx + uuvx;
  out[1] = y + uvy + uuvy;
  out[2] = z + uvz + uuvz;
  return out;
}
/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateX(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[0];
  r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
  r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad); //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateY(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
  r[1] = p[1];
  r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad); //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateZ(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
  r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
  r[2] = p[2]; //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Get the angle between two 3D vectors
 * @param {ReadonlyVec3} a The first operand
 * @param {ReadonlyVec3} b The second operand
 * @returns {Number} The angle in radians
 */

function angle(a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2],
      bx = b[0],
      by = b[1],
      bz = b[2],
      mag1 = Math.sqrt(ax * ax + ay * ay + az * az),
      mag2 = Math.sqrt(bx * bx + by * by + bz * bz),
      mag = mag1 * mag2,
      cosine = mag && dot(a, b) / mag;
  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}
/**
 * Set the components of a vec3 to zero
 *
 * @param {vec3} out the receiving vector
 * @returns {vec3} out
 */

function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  return out;
}
/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec3} a vector to represent as a string
 * @returns {String} string representation of the vector
 */

function str(a) {
  return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
}
/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2];
  return Math.abs(a0 - b0) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
}
/**
 * Alias for {@link vec3.subtract}
 * @function
 */

var sub = subtract;
/**
 * Alias for {@link vec3.multiply}
 * @function
 */

var mul = multiply;
/**
 * Alias for {@link vec3.divide}
 * @function
 */

var div = divide;
/**
 * Alias for {@link vec3.distance}
 * @function
 */

var dist = distance;
/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */

var sqrDist = squaredDistance;
/**
 * Alias for {@link vec3.length}
 * @function
 */

var len = length;
/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */

var sqrLen = squaredLength;
/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

var forEach = function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }

    return a;
  };
}();

/***/ }),

/***/ "./node_modules/gl-matrix/esm/vec4.js":
/*!********************************************!*\
  !*** ./node_modules/gl-matrix/esm/vec4.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   add: () => (/* binding */ add),
/* harmony export */   ceil: () => (/* binding */ ceil),
/* harmony export */   clone: () => (/* binding */ clone),
/* harmony export */   copy: () => (/* binding */ copy),
/* harmony export */   create: () => (/* binding */ create),
/* harmony export */   cross: () => (/* binding */ cross),
/* harmony export */   dist: () => (/* binding */ dist),
/* harmony export */   distance: () => (/* binding */ distance),
/* harmony export */   div: () => (/* binding */ div),
/* harmony export */   divide: () => (/* binding */ divide),
/* harmony export */   dot: () => (/* binding */ dot),
/* harmony export */   equals: () => (/* binding */ equals),
/* harmony export */   exactEquals: () => (/* binding */ exactEquals),
/* harmony export */   floor: () => (/* binding */ floor),
/* harmony export */   forEach: () => (/* binding */ forEach),
/* harmony export */   fromValues: () => (/* binding */ fromValues),
/* harmony export */   inverse: () => (/* binding */ inverse),
/* harmony export */   len: () => (/* binding */ len),
/* harmony export */   length: () => (/* binding */ length),
/* harmony export */   lerp: () => (/* binding */ lerp),
/* harmony export */   max: () => (/* binding */ max),
/* harmony export */   min: () => (/* binding */ min),
/* harmony export */   mul: () => (/* binding */ mul),
/* harmony export */   multiply: () => (/* binding */ multiply),
/* harmony export */   negate: () => (/* binding */ negate),
/* harmony export */   normalize: () => (/* binding */ normalize),
/* harmony export */   random: () => (/* binding */ random),
/* harmony export */   round: () => (/* binding */ round),
/* harmony export */   scale: () => (/* binding */ scale),
/* harmony export */   scaleAndAdd: () => (/* binding */ scaleAndAdd),
/* harmony export */   set: () => (/* binding */ set),
/* harmony export */   sqrDist: () => (/* binding */ sqrDist),
/* harmony export */   sqrLen: () => (/* binding */ sqrLen),
/* harmony export */   squaredDistance: () => (/* binding */ squaredDistance),
/* harmony export */   squaredLength: () => (/* binding */ squaredLength),
/* harmony export */   str: () => (/* binding */ str),
/* harmony export */   sub: () => (/* binding */ sub),
/* harmony export */   subtract: () => (/* binding */ subtract),
/* harmony export */   transformMat4: () => (/* binding */ transformMat4),
/* harmony export */   transformQuat: () => (/* binding */ transformQuat),
/* harmony export */   zero: () => (/* binding */ zero)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common.js */ "./node_modules/gl-matrix/esm/common.js");

/**
 * 4 Dimensional Vector
 * @module vec4
 */

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */

function create() {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(4);

  if (_common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }

  return out;
}
/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {ReadonlyVec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */

function clone(a) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */

function fromValues(x, y, z, w) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(4);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}
/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the source vector
 * @returns {vec4} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */

function set(out, x, y, z, w) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}
/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}
/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  out[3] = a[3] * b[3];
  return out;
}
/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  out[3] = a[3] / b[3];
  return out;
}
/**
 * Math.ceil the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to ceil
 * @returns {vec4} out
 */

function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  out[3] = Math.ceil(a[3]);
  return out;
}
/**
 * Math.floor the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to floor
 * @returns {vec4} out
 */

function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  out[3] = Math.floor(a[3]);
  return out;
}
/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  out[3] = Math.min(a[3], b[3]);
  return out;
}
/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  out[3] = Math.max(a[3], b[3]);
  return out;
}
/**
 * Math.round the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to round
 * @returns {vec4} out
 */

function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  out[3] = Math.round(a[3]);
  return out;
}
/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */

function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}
/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */

function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  return out;
}
/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} distance between a and b
 */

function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return Math.hypot(x, y, z, w);
}
/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} squared distance between a and b
 */

function squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return x * x + y * y + z * z + w * w;
}
/**
 * Calculates the length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate length of
 * @returns {Number} length of a
 */

function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return Math.hypot(x, y, z, w);
}
/**
 * Calculates the squared length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */

function squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return x * x + y * y + z * z + w * w;
}
/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to negate
 * @returns {vec4} out
 */

function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = -a[3];
  return out;
}
/**
 * Returns the inverse of the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to invert
 * @returns {vec4} out
 */

function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  out[3] = 1.0 / a[3];
  return out;
}
/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to normalize
 * @returns {vec4} out
 */

function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  var len = x * x + y * y + z * z + w * w;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }

  out[0] = x * len;
  out[1] = y * len;
  out[2] = z * len;
  out[3] = w * len;
  return out;
}
/**
 * Calculates the dot product of two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} dot product of a and b
 */

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
/**
 * Returns the cross-product of three vectors in a 4-dimensional space
 *
 * @param {ReadonlyVec4} result the receiving vector
 * @param {ReadonlyVec4} U the first vector
 * @param {ReadonlyVec4} V the second vector
 * @param {ReadonlyVec4} W the third vector
 * @returns {vec4} result
 */

function cross(out, u, v, w) {
  var A = v[0] * w[1] - v[1] * w[0],
      B = v[0] * w[2] - v[2] * w[0],
      C = v[0] * w[3] - v[3] * w[0],
      D = v[1] * w[2] - v[2] * w[1],
      E = v[1] * w[3] - v[3] * w[1],
      F = v[2] * w[3] - v[3] * w[2];
  var G = u[0];
  var H = u[1];
  var I = u[2];
  var J = u[3];
  out[0] = H * F - I * E + J * D;
  out[1] = -(G * F) + I * C - J * B;
  out[2] = G * E - H * C + J * A;
  out[3] = -(G * D) + H * B - I * A;
  return out;
}
/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec4} out
 */

function lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  var aw = a[3];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  out[3] = aw + t * (b[3] - aw);
  return out;
}
/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec4} out
 */

function random(out, scale) {
  scale = scale || 1.0; // Marsaglia, George. Choosing a Point from the Surface of a
  // Sphere. Ann. Math. Statist. 43 (1972), no. 2, 645--646.
  // http://projecteuclid.org/euclid.aoms/1177692644;

  var v1, v2, v3, v4;
  var s1, s2;

  do {
    v1 = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2 - 1;
    v2 = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2 - 1;
    s1 = v1 * v1 + v2 * v2;
  } while (s1 >= 1);

  do {
    v3 = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2 - 1;
    v4 = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2 - 1;
    s2 = v3 * v3 + v4 * v4;
  } while (s2 >= 1);

  var d = Math.sqrt((1 - s1) / s2);
  out[0] = scale * v1;
  out[1] = scale * v2;
  out[2] = scale * v3 * d;
  out[3] = scale * v4 * d;
  return out;
}
/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec4} out
 */

function transformMat4(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2],
      w = a[3];
  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return out;
}
/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyQuat} q quaternion to transform with
 * @returns {vec4} out
 */

function transformQuat(out, a, q) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3]; // calculate quat * vec

  var ix = qw * x + qy * z - qz * y;
  var iy = qw * y + qz * x - qx * z;
  var iz = qw * z + qx * y - qy * x;
  var iw = -qx * x - qy * y - qz * z; // calculate result * inverse quat

  out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  out[3] = a[3];
  return out;
}
/**
 * Set the components of a vec4 to zero
 *
 * @param {vec4} out the receiving vector
 * @returns {vec4} out
 */

function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  return out;
}
/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec4} a vector to represent as a string
 * @returns {String} string representation of the vector
 */

function str(a) {
  return "vec4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}
/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  return Math.abs(a0 - b0) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
}
/**
 * Alias for {@link vec4.subtract}
 * @function
 */

var sub = subtract;
/**
 * Alias for {@link vec4.multiply}
 * @function
 */

var mul = multiply;
/**
 * Alias for {@link vec4.divide}
 * @function
 */

var div = divide;
/**
 * Alias for {@link vec4.distance}
 * @function
 */

var dist = distance;
/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */

var sqrDist = squaredDistance;
/**
 * Alias for {@link vec4.length}
 * @function
 */

var len = length;
/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */

var sqrLen = squaredLength;
/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

var forEach = function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 4;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
      a[i + 3] = vec[3];
    }

    return a;
  };
}();

/***/ }),

/***/ "./node_modules/jszip/dist/jszip.min.js":
/*!**********************************************!*\
  !*** ./node_modules/jszip/dist/jszip.min.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!

JSZip v3.10.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*/

!function(e){if(true)module.exports=e();else {}}(function(){return function s(a,o,h){function u(r,e){if(!o[r]){if(!a[r]){var t=undefined;if(!e&&t)return require(r,!0);if(l)return l(r,!0);var n=new Error("Cannot find module '"+r+"'");throw n.code="MODULE_NOT_FOUND",n}var i=o[r]={exports:{}};a[r][0].call(i.exports,function(e){var t=a[r][1][e];return u(t||e)},i,i.exports,s,a,o,h)}return o[r].exports}for(var l=undefined,e=0;e<h.length;e++)u(h[e]);return u}({1:[function(e,t,r){"use strict";var d=e("./utils"),c=e("./support"),p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";r.encode=function(e){for(var t,r,n,i,s,a,o,h=[],u=0,l=e.length,f=l,c="string"!==d.getTypeOf(e);u<e.length;)f=l-u,n=c?(t=e[u++],r=u<l?e[u++]:0,u<l?e[u++]:0):(t=e.charCodeAt(u++),r=u<l?e.charCodeAt(u++):0,u<l?e.charCodeAt(u++):0),i=t>>2,s=(3&t)<<4|r>>4,a=1<f?(15&r)<<2|n>>6:64,o=2<f?63&n:64,h.push(p.charAt(i)+p.charAt(s)+p.charAt(a)+p.charAt(o));return h.join("")},r.decode=function(e){var t,r,n,i,s,a,o=0,h=0,u="data:";if(e.substr(0,u.length)===u)throw new Error("Invalid base64 input, it looks like a data url.");var l,f=3*(e=e.replace(/[^A-Za-z0-9+/=]/g,"")).length/4;if(e.charAt(e.length-1)===p.charAt(64)&&f--,e.charAt(e.length-2)===p.charAt(64)&&f--,f%1!=0)throw new Error("Invalid base64 input, bad content length.");for(l=c.uint8array?new Uint8Array(0|f):new Array(0|f);o<e.length;)t=p.indexOf(e.charAt(o++))<<2|(i=p.indexOf(e.charAt(o++)))>>4,r=(15&i)<<4|(s=p.indexOf(e.charAt(o++)))>>2,n=(3&s)<<6|(a=p.indexOf(e.charAt(o++))),l[h++]=t,64!==s&&(l[h++]=r),64!==a&&(l[h++]=n);return l}},{"./support":30,"./utils":32}],2:[function(e,t,r){"use strict";var n=e("./external"),i=e("./stream/DataWorker"),s=e("./stream/Crc32Probe"),a=e("./stream/DataLengthProbe");function o(e,t,r,n,i){this.compressedSize=e,this.uncompressedSize=t,this.crc32=r,this.compression=n,this.compressedContent=i}o.prototype={getContentWorker:function(){var e=new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")),t=this;return e.on("end",function(){if(this.streamInfo.data_length!==t.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),e},getCompressedWorker:function(){return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},o.createWorkerFrom=function(e,t,r){return e.pipe(new s).pipe(new a("uncompressedSize")).pipe(t.compressWorker(r)).pipe(new a("compressedSize")).withStreamInfo("compression",t)},t.exports=o},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(e,t,r){"use strict";var n=e("./stream/GenericWorker");r.STORE={magic:"\0\0",compressWorker:function(){return new n("STORE compression")},uncompressWorker:function(){return new n("STORE decompression")}},r.DEFLATE=e("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(e,t,r){"use strict";var n=e("./utils");var o=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e}return t}();t.exports=function(e,t){return void 0!==e&&e.length?"string"!==n.getTypeOf(e)?function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t[a])];return-1^e}(0|t,e,e.length,0):function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t.charCodeAt(a))];return-1^e}(0|t,e,e.length,0):0}},{"./utils":32}],5:[function(e,t,r){"use strict";r.base64=!1,r.binary=!1,r.dir=!1,r.createFolders=!0,r.date=null,r.compression=null,r.compressionOptions=null,r.comment=null,r.unixPermissions=null,r.dosPermissions=null},{}],6:[function(e,t,r){"use strict";var n=null;n="undefined"!=typeof Promise?Promise:e("lie"),t.exports={Promise:n}},{lie:37}],7:[function(e,t,r){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array,i=e("pako"),s=e("./utils"),a=e("./stream/GenericWorker"),o=n?"uint8array":"array";function h(e,t){a.call(this,"FlateWorker/"+e),this._pako=null,this._pakoAction=e,this._pakoOptions=t,this.meta={}}r.magic="\b\0",s.inherits(h,a),h.prototype.processChunk=function(e){this.meta=e.meta,null===this._pako&&this._createPako(),this._pako.push(s.transformTo(o,e.data),!1)},h.prototype.flush=function(){a.prototype.flush.call(this),null===this._pako&&this._createPako(),this._pako.push([],!0)},h.prototype.cleanUp=function(){a.prototype.cleanUp.call(this),this._pako=null},h.prototype._createPako=function(){this._pako=new i[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var t=this;this._pako.onData=function(e){t.push({data:e,meta:t.meta})}},r.compressWorker=function(e){return new h("Deflate",e)},r.uncompressWorker=function(){return new h("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(e,t,r){"use strict";function A(e,t){var r,n="";for(r=0;r<t;r++)n+=String.fromCharCode(255&e),e>>>=8;return n}function n(e,t,r,n,i,s){var a,o,h=e.file,u=e.compression,l=s!==O.utf8encode,f=I.transformTo("string",s(h.name)),c=I.transformTo("string",O.utf8encode(h.name)),d=h.comment,p=I.transformTo("string",s(d)),m=I.transformTo("string",O.utf8encode(d)),_=c.length!==h.name.length,g=m.length!==d.length,b="",v="",y="",w=h.dir,k=h.date,x={crc32:0,compressedSize:0,uncompressedSize:0};t&&!r||(x.crc32=e.crc32,x.compressedSize=e.compressedSize,x.uncompressedSize=e.uncompressedSize);var S=0;t&&(S|=8),l||!_&&!g||(S|=2048);var z=0,C=0;w&&(z|=16),"UNIX"===i?(C=798,z|=function(e,t){var r=e;return e||(r=t?16893:33204),(65535&r)<<16}(h.unixPermissions,w)):(C=20,z|=function(e){return 63&(e||0)}(h.dosPermissions)),a=k.getUTCHours(),a<<=6,a|=k.getUTCMinutes(),a<<=5,a|=k.getUTCSeconds()/2,o=k.getUTCFullYear()-1980,o<<=4,o|=k.getUTCMonth()+1,o<<=5,o|=k.getUTCDate(),_&&(v=A(1,1)+A(B(f),4)+c,b+="up"+A(v.length,2)+v),g&&(y=A(1,1)+A(B(p),4)+m,b+="uc"+A(y.length,2)+y);var E="";return E+="\n\0",E+=A(S,2),E+=u.magic,E+=A(a,2),E+=A(o,2),E+=A(x.crc32,4),E+=A(x.compressedSize,4),E+=A(x.uncompressedSize,4),E+=A(f.length,2),E+=A(b.length,2),{fileRecord:R.LOCAL_FILE_HEADER+E+f+b,dirRecord:R.CENTRAL_FILE_HEADER+A(C,2)+E+A(p.length,2)+"\0\0\0\0"+A(z,4)+A(n,4)+f+b+p}}var I=e("../utils"),i=e("../stream/GenericWorker"),O=e("../utf8"),B=e("../crc32"),R=e("../signature");function s(e,t,r,n){i.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=t,this.zipPlatform=r,this.encodeFileName=n,this.streamFiles=e,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}I.inherits(s,i),s.prototype.push=function(e){var t=e.meta.percent||0,r=this.entriesCount,n=this._sources.length;this.accumulate?this.contentBuffer.push(e):(this.bytesWritten+=e.data.length,i.prototype.push.call(this,{data:e.data,meta:{currentFile:this.currentFile,percent:r?(t+100*(r-n-1))/r:100}}))},s.prototype.openedSource=function(e){this.currentSourceOffset=this.bytesWritten,this.currentFile=e.file.name;var t=this.streamFiles&&!e.file.dir;if(t){var r=n(e,t,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:r.fileRecord,meta:{percent:0}})}else this.accumulate=!0},s.prototype.closedSource=function(e){this.accumulate=!1;var t=this.streamFiles&&!e.file.dir,r=n(e,t,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(r.dirRecord),t)this.push({data:function(e){return R.DATA_DESCRIPTOR+A(e.crc32,4)+A(e.compressedSize,4)+A(e.uncompressedSize,4)}(e),meta:{percent:100}});else for(this.push({data:r.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},s.prototype.flush=function(){for(var e=this.bytesWritten,t=0;t<this.dirRecords.length;t++)this.push({data:this.dirRecords[t],meta:{percent:100}});var r=this.bytesWritten-e,n=function(e,t,r,n,i){var s=I.transformTo("string",i(n));return R.CENTRAL_DIRECTORY_END+"\0\0\0\0"+A(e,2)+A(e,2)+A(t,4)+A(r,4)+A(s.length,2)+s}(this.dirRecords.length,r,e,this.zipComment,this.encodeFileName);this.push({data:n,meta:{percent:100}})},s.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},s.prototype.registerPrevious=function(e){this._sources.push(e);var t=this;return e.on("data",function(e){t.processChunk(e)}),e.on("end",function(){t.closedSource(t.previous.streamInfo),t._sources.length?t.prepareNextSource():t.end()}),e.on("error",function(e){t.error(e)}),this},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},s.prototype.error=function(e){var t=this._sources;if(!i.prototype.error.call(this,e))return!1;for(var r=0;r<t.length;r++)try{t[r].error(e)}catch(e){}return!0},s.prototype.lock=function(){i.prototype.lock.call(this);for(var e=this._sources,t=0;t<e.length;t++)e[t].lock()},t.exports=s},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(e,t,r){"use strict";var u=e("../compressions"),n=e("./ZipFileWorker");r.generateWorker=function(e,a,t){var o=new n(a.streamFiles,t,a.platform,a.encodeFileName),h=0;try{e.forEach(function(e,t){h++;var r=function(e,t){var r=e||t,n=u[r];if(!n)throw new Error(r+" is not a valid compression method !");return n}(t.options.compression,a.compression),n=t.options.compressionOptions||a.compressionOptions||{},i=t.dir,s=t.date;t._compressWorker(r,n).withStreamInfo("file",{name:e,dir:i,date:s,comment:t.comment||"",unixPermissions:t.unixPermissions,dosPermissions:t.dosPermissions}).pipe(o)}),o.entriesCount=h}catch(e){o.error(e)}return o}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(e,t,r){"use strict";function n(){if(!(this instanceof n))return new n;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files=Object.create(null),this.comment=null,this.root="",this.clone=function(){var e=new n;for(var t in this)"function"!=typeof this[t]&&(e[t]=this[t]);return e}}(n.prototype=e("./object")).loadAsync=e("./load"),n.support=e("./support"),n.defaults=e("./defaults"),n.version="3.10.1",n.loadAsync=function(e,t){return(new n).loadAsync(e,t)},n.external=e("./external"),t.exports=n},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(e,t,r){"use strict";var u=e("./utils"),i=e("./external"),n=e("./utf8"),s=e("./zipEntries"),a=e("./stream/Crc32Probe"),l=e("./nodejsUtils");function f(n){return new i.Promise(function(e,t){var r=n.decompressed.getContentWorker().pipe(new a);r.on("error",function(e){t(e)}).on("end",function(){r.streamInfo.crc32!==n.decompressed.crc32?t(new Error("Corrupted zip : CRC32 mismatch")):e()}).resume()})}t.exports=function(e,o){var h=this;return o=u.extend(o||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:n.utf8decode}),l.isNode&&l.isStream(e)?i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):u.prepareContent("the loaded zip file",e,!0,o.optimizedBinaryString,o.base64).then(function(e){var t=new s(o);return t.load(e),t}).then(function(e){var t=[i.Promise.resolve(e)],r=e.files;if(o.checkCRC32)for(var n=0;n<r.length;n++)t.push(f(r[n]));return i.Promise.all(t)}).then(function(e){for(var t=e.shift(),r=t.files,n=0;n<r.length;n++){var i=r[n],s=i.fileNameStr,a=u.resolve(i.fileNameStr);h.file(a,i.decompressed,{binary:!0,optimizedBinaryString:!0,date:i.date,dir:i.dir,comment:i.fileCommentStr.length?i.fileCommentStr:null,unixPermissions:i.unixPermissions,dosPermissions:i.dosPermissions,createFolders:o.createFolders}),i.dir||(h.file(a).unsafeOriginalName=s)}return t.zipComment.length&&(h.comment=t.zipComment),h})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(e,t,r){"use strict";var n=e("../utils"),i=e("../stream/GenericWorker");function s(e,t){i.call(this,"Nodejs stream input adapter for "+e),this._upstreamEnded=!1,this._bindStream(t)}n.inherits(s,i),s.prototype._bindStream=function(e){var t=this;(this._stream=e).pause(),e.on("data",function(e){t.push({data:e,meta:{percent:0}})}).on("error",function(e){t.isPaused?this.generatedError=e:t.error(e)}).on("end",function(){t.isPaused?t._upstreamEnded=!0:t.end()})},s.prototype.pause=function(){return!!i.prototype.pause.call(this)&&(this._stream.pause(),!0)},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},t.exports=s},{"../stream/GenericWorker":28,"../utils":32}],13:[function(e,t,r){"use strict";var i=e("readable-stream").Readable;function n(e,t,r){i.call(this,t),this._helper=e;var n=this;e.on("data",function(e,t){n.push(e)||n._helper.pause(),r&&r(t)}).on("error",function(e){n.emit("error",e)}).on("end",function(){n.push(null)})}e("../utils").inherits(n,i),n.prototype._read=function(){this._helper.resume()},t.exports=n},{"../utils":32,"readable-stream":16}],14:[function(e,t,r){"use strict";t.exports={isNode:"undefined"!=typeof Buffer,newBufferFrom:function(e,t){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(e,t);if("number"==typeof e)throw new Error('The "data" argument must not be a number');return new Buffer(e,t)},allocBuffer:function(e){if(Buffer.alloc)return Buffer.alloc(e);var t=new Buffer(e);return t.fill(0),t},isBuffer:function(e){return Buffer.isBuffer(e)},isStream:function(e){return e&&"function"==typeof e.on&&"function"==typeof e.pause&&"function"==typeof e.resume}}},{}],15:[function(e,t,r){"use strict";function s(e,t,r){var n,i=u.getTypeOf(t),s=u.extend(r||{},f);s.date=s.date||new Date,null!==s.compression&&(s.compression=s.compression.toUpperCase()),"string"==typeof s.unixPermissions&&(s.unixPermissions=parseInt(s.unixPermissions,8)),s.unixPermissions&&16384&s.unixPermissions&&(s.dir=!0),s.dosPermissions&&16&s.dosPermissions&&(s.dir=!0),s.dir&&(e=g(e)),s.createFolders&&(n=_(e))&&b.call(this,n,!0);var a="string"===i&&!1===s.binary&&!1===s.base64;r&&void 0!==r.binary||(s.binary=!a),(t instanceof c&&0===t.uncompressedSize||s.dir||!t||0===t.length)&&(s.base64=!1,s.binary=!0,t="",s.compression="STORE",i="string");var o=null;o=t instanceof c||t instanceof l?t:p.isNode&&p.isStream(t)?new m(e,t):u.prepareContent(e,t,s.binary,s.optimizedBinaryString,s.base64);var h=new d(e,o,s);this.files[e]=h}var i=e("./utf8"),u=e("./utils"),l=e("./stream/GenericWorker"),a=e("./stream/StreamHelper"),f=e("./defaults"),c=e("./compressedObject"),d=e("./zipObject"),o=e("./generate"),p=e("./nodejsUtils"),m=e("./nodejs/NodejsStreamInputAdapter"),_=function(e){"/"===e.slice(-1)&&(e=e.substring(0,e.length-1));var t=e.lastIndexOf("/");return 0<t?e.substring(0,t):""},g=function(e){return"/"!==e.slice(-1)&&(e+="/"),e},b=function(e,t){return t=void 0!==t?t:f.createFolders,e=g(e),this.files[e]||s.call(this,e,null,{dir:!0,createFolders:t}),this.files[e]};function h(e){return"[object RegExp]"===Object.prototype.toString.call(e)}var n={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(e){var t,r,n;for(t in this.files)n=this.files[t],(r=t.slice(this.root.length,t.length))&&t.slice(0,this.root.length)===this.root&&e(r,n)},filter:function(r){var n=[];return this.forEach(function(e,t){r(e,t)&&n.push(t)}),n},file:function(e,t,r){if(1!==arguments.length)return e=this.root+e,s.call(this,e,t,r),this;if(h(e)){var n=e;return this.filter(function(e,t){return!t.dir&&n.test(e)})}var i=this.files[this.root+e];return i&&!i.dir?i:null},folder:function(r){if(!r)return this;if(h(r))return this.filter(function(e,t){return t.dir&&r.test(e)});var e=this.root+r,t=b.call(this,e),n=this.clone();return n.root=t.name,n},remove:function(r){r=this.root+r;var e=this.files[r];if(e||("/"!==r.slice(-1)&&(r+="/"),e=this.files[r]),e&&!e.dir)delete this.files[r];else for(var t=this.filter(function(e,t){return t.name.slice(0,r.length)===r}),n=0;n<t.length;n++)delete this.files[t[n].name];return this},generate:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(e){var t,r={};try{if((r=u.extend(e||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:i.utf8encode})).type=r.type.toLowerCase(),r.compression=r.compression.toUpperCase(),"binarystring"===r.type&&(r.type="string"),!r.type)throw new Error("No output type specified.");u.checkSupport(r.type),"darwin"!==r.platform&&"freebsd"!==r.platform&&"linux"!==r.platform&&"sunos"!==r.platform||(r.platform="UNIX"),"win32"===r.platform&&(r.platform="DOS");var n=r.comment||this.comment||"";t=o.generateWorker(this,r,n)}catch(e){(t=new l("error")).error(e)}return new a(t,r.type||"string",r.mimeType)},generateAsync:function(e,t){return this.generateInternalStream(e).accumulate(t)},generateNodeStream:function(e,t){return(e=e||{}).type||(e.type="nodebuffer"),this.generateInternalStream(e).toNodejsStream(t)}};t.exports=n},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(e,t,r){"use strict";t.exports=e("stream")},{stream:void 0}],17:[function(e,t,r){"use strict";var n=e("./DataReader");function i(e){n.call(this,e);for(var t=0;t<this.data.length;t++)e[t]=255&e[t]}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data[this.zero+e]},i.prototype.lastIndexOfSignature=function(e){for(var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.length-4;0<=s;--s)if(this.data[s]===t&&this.data[s+1]===r&&this.data[s+2]===n&&this.data[s+3]===i)return s-this.zero;return-1},i.prototype.readAndCheckSignature=function(e){var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.readData(4);return t===s[0]&&r===s[1]&&n===s[2]&&i===s[3]},i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return[];var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],18:[function(e,t,r){"use strict";var n=e("../utils");function i(e){this.data=e,this.length=e.length,this.index=0,this.zero=0}i.prototype={checkOffset:function(e){this.checkIndex(this.index+e)},checkIndex:function(e){if(this.length<this.zero+e||e<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+e+"). Corrupted zip ?")},setIndex:function(e){this.checkIndex(e),this.index=e},skip:function(e){this.setIndex(this.index+e)},byteAt:function(){},readInt:function(e){var t,r=0;for(this.checkOffset(e),t=this.index+e-1;t>=this.index;t--)r=(r<<8)+this.byteAt(t);return this.index+=e,r},readString:function(e){return n.transformTo("string",this.readData(e))},readData:function(){},lastIndexOfSignature:function(){},readAndCheckSignature:function(){},readDate:function(){var e=this.readInt(4);return new Date(Date.UTC(1980+(e>>25&127),(e>>21&15)-1,e>>16&31,e>>11&31,e>>5&63,(31&e)<<1))}},t.exports=i},{"../utils":32}],19:[function(e,t,r){"use strict";var n=e("./Uint8ArrayReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(e,t,r){"use strict";var n=e("./DataReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data.charCodeAt(this.zero+e)},i.prototype.lastIndexOfSignature=function(e){return this.data.lastIndexOf(e)-this.zero},i.prototype.readAndCheckSignature=function(e){return e===this.readData(4)},i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],21:[function(e,t,r){"use strict";var n=e("./ArrayReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return new Uint8Array(0);var t=this.data.subarray(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./ArrayReader":17}],22:[function(e,t,r){"use strict";var n=e("../utils"),i=e("../support"),s=e("./ArrayReader"),a=e("./StringReader"),o=e("./NodeBufferReader"),h=e("./Uint8ArrayReader");t.exports=function(e){var t=n.getTypeOf(e);return n.checkSupport(t),"string"!==t||i.uint8array?"nodebuffer"===t?new o(e):i.uint8array?new h(n.transformTo("uint8array",e)):new s(n.transformTo("array",e)):new a(e)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(e,t,r){"use strict";r.LOCAL_FILE_HEADER="PK",r.CENTRAL_FILE_HEADER="PK",r.CENTRAL_DIRECTORY_END="PK",r.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK",r.ZIP64_CENTRAL_DIRECTORY_END="PK",r.DATA_DESCRIPTOR="PK\b"},{}],24:[function(e,t,r){"use strict";var n=e("./GenericWorker"),i=e("../utils");function s(e){n.call(this,"ConvertWorker to "+e),this.destType=e}i.inherits(s,n),s.prototype.processChunk=function(e){this.push({data:i.transformTo(this.destType,e.data),meta:e.meta})},t.exports=s},{"../utils":32,"./GenericWorker":28}],25:[function(e,t,r){"use strict";var n=e("./GenericWorker"),i=e("../crc32");function s(){n.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}e("../utils").inherits(s,n),s.prototype.processChunk=function(e){this.streamInfo.crc32=i(e.data,this.streamInfo.crc32||0),this.push(e)},t.exports=s},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(e,t,r){"use strict";var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataLengthProbe for "+e),this.propName=e,this.withStreamInfo(e,0)}n.inherits(s,i),s.prototype.processChunk=function(e){if(e){var t=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=t+e.data.length}i.prototype.processChunk.call(this,e)},t.exports=s},{"../utils":32,"./GenericWorker":28}],27:[function(e,t,r){"use strict";var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataWorker");var t=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,e.then(function(e){t.dataIsReady=!0,t.data=e,t.max=e&&e.length||0,t.type=n.getTypeOf(e),t.isPaused||t._tickAndRepeat()},function(e){t.error(e)})}n.inherits(s,i),s.prototype.cleanUp=function(){i.prototype.cleanUp.call(this),this.data=null},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,n.delay(this._tickAndRepeat,[],this)),!0)},s.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(n.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},s.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var e=null,t=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":e=this.data.substring(this.index,t);break;case"uint8array":e=this.data.subarray(this.index,t);break;case"array":case"nodebuffer":e=this.data.slice(this.index,t)}return this.index=t,this.push({data:e,meta:{percent:this.max?this.index/this.max*100:0}})},t.exports=s},{"../utils":32,"./GenericWorker":28}],28:[function(e,t,r){"use strict";function n(e){this.name=e||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}n.prototype={push:function(e){this.emit("data",e)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(e){this.emit("error",e)}return!0},error:function(e){return!this.isFinished&&(this.isPaused?this.generatedError=e:(this.isFinished=!0,this.emit("error",e),this.previous&&this.previous.error(e),this.cleanUp()),!0)},on:function(e,t){return this._listeners[e].push(t),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(e,t){if(this._listeners[e])for(var r=0;r<this._listeners[e].length;r++)this._listeners[e][r].call(this,t)},pipe:function(e){return e.registerPrevious(this)},registerPrevious:function(e){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=e.streamInfo,this.mergeStreamInfo(),this.previous=e;var t=this;return e.on("data",function(e){t.processChunk(e)}),e.on("end",function(){t.end()}),e.on("error",function(e){t.error(e)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var e=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),e=!0),this.previous&&this.previous.resume(),!e},flush:function(){},processChunk:function(e){this.push(e)},withStreamInfo:function(e,t){return this.extraStreamInfo[e]=t,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var e in this.extraStreamInfo)Object.prototype.hasOwnProperty.call(this.extraStreamInfo,e)&&(this.streamInfo[e]=this.extraStreamInfo[e])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var e="Worker "+this.name;return this.previous?this.previous+" -> "+e:e}},t.exports=n},{}],29:[function(e,t,r){"use strict";var h=e("../utils"),i=e("./ConvertWorker"),s=e("./GenericWorker"),u=e("../base64"),n=e("../support"),a=e("../external"),o=null;if(n.nodestream)try{o=e("../nodejs/NodejsStreamOutputAdapter")}catch(e){}function l(e,o){return new a.Promise(function(t,r){var n=[],i=e._internalType,s=e._outputType,a=e._mimeType;e.on("data",function(e,t){n.push(e),o&&o(t)}).on("error",function(e){n=[],r(e)}).on("end",function(){try{var e=function(e,t,r){switch(e){case"blob":return h.newBlob(h.transformTo("arraybuffer",t),r);case"base64":return u.encode(t);default:return h.transformTo(e,t)}}(s,function(e,t){var r,n=0,i=null,s=0;for(r=0;r<t.length;r++)s+=t[r].length;switch(e){case"string":return t.join("");case"array":return Array.prototype.concat.apply([],t);case"uint8array":for(i=new Uint8Array(s),r=0;r<t.length;r++)i.set(t[r],n),n+=t[r].length;return i;case"nodebuffer":return Buffer.concat(t);default:throw new Error("concat : unsupported type '"+e+"'")}}(i,n),a);t(e)}catch(e){r(e)}n=[]}).resume()})}function f(e,t,r){var n=t;switch(t){case"blob":case"arraybuffer":n="uint8array";break;case"base64":n="string"}try{this._internalType=n,this._outputType=t,this._mimeType=r,h.checkSupport(n),this._worker=e.pipe(new i(n)),e.lock()}catch(e){this._worker=new s("error"),this._worker.error(e)}}f.prototype={accumulate:function(e){return l(this,e)},on:function(e,t){var r=this;return"data"===e?this._worker.on(e,function(e){t.call(r,e.data,e.meta)}):this._worker.on(e,function(){h.delay(t,arguments,r)}),this},resume:function(){return h.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(e){if(h.checkSupport("nodestream"),"nodebuffer"!==this._outputType)throw new Error(this._outputType+" is not supported by this method");return new o(this,{objectMode:"nodebuffer"!==this._outputType},e)}},t.exports=f},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(e,t,r){"use strict";if(r.base64=!0,r.array=!0,r.string=!0,r.arraybuffer="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof Uint8Array,r.nodebuffer="undefined"!=typeof Buffer,r.uint8array="undefined"!=typeof Uint8Array,"undefined"==typeof ArrayBuffer)r.blob=!1;else{var n=new ArrayBuffer(0);try{r.blob=0===new Blob([n],{type:"application/zip"}).size}catch(e){try{var i=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);i.append(n),r.blob=0===i.getBlob("application/zip").size}catch(e){r.blob=!1}}}try{r.nodestream=!!e("readable-stream").Readable}catch(e){r.nodestream=!1}},{"readable-stream":16}],31:[function(e,t,s){"use strict";for(var o=e("./utils"),h=e("./support"),r=e("./nodejsUtils"),n=e("./stream/GenericWorker"),u=new Array(256),i=0;i<256;i++)u[i]=252<=i?6:248<=i?5:240<=i?4:224<=i?3:192<=i?2:1;u[254]=u[254]=1;function a(){n.call(this,"utf-8 decode"),this.leftOver=null}function l(){n.call(this,"utf-8 encode")}s.utf8encode=function(e){return h.nodebuffer?r.newBufferFrom(e,"utf-8"):function(e){var t,r,n,i,s,a=e.length,o=0;for(i=0;i<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),o+=r<128?1:r<2048?2:r<65536?3:4;for(t=h.uint8array?new Uint8Array(o):new Array(o),i=s=0;s<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t}(e)},s.utf8decode=function(e){return h.nodebuffer?o.transformTo("nodebuffer",e).toString("utf-8"):function(e){var t,r,n,i,s=e.length,a=new Array(2*s);for(t=r=0;t<s;)if((n=e[t++])<128)a[r++]=n;else if(4<(i=u[n]))a[r++]=65533,t+=i-1;else{for(n&=2===i?31:3===i?15:7;1<i&&t<s;)n=n<<6|63&e[t++],i--;1<i?a[r++]=65533:n<65536?a[r++]=n:(n-=65536,a[r++]=55296|n>>10&1023,a[r++]=56320|1023&n)}return a.length!==r&&(a.subarray?a=a.subarray(0,r):a.length=r),o.applyFromCharCode(a)}(e=o.transformTo(h.uint8array?"uint8array":"array",e))},o.inherits(a,n),a.prototype.processChunk=function(e){var t=o.transformTo(h.uint8array?"uint8array":"array",e.data);if(this.leftOver&&this.leftOver.length){if(h.uint8array){var r=t;(t=new Uint8Array(r.length+this.leftOver.length)).set(this.leftOver,0),t.set(r,this.leftOver.length)}else t=this.leftOver.concat(t);this.leftOver=null}var n=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t}(t),i=t;n!==t.length&&(h.uint8array?(i=t.subarray(0,n),this.leftOver=t.subarray(n,t.length)):(i=t.slice(0,n),this.leftOver=t.slice(n,t.length))),this.push({data:s.utf8decode(i),meta:e.meta})},a.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:s.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},s.Utf8DecodeWorker=a,o.inherits(l,n),l.prototype.processChunk=function(e){this.push({data:s.utf8encode(e.data),meta:e.meta})},s.Utf8EncodeWorker=l},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(e,t,a){"use strict";var o=e("./support"),h=e("./base64"),r=e("./nodejsUtils"),u=e("./external");function n(e){return e}function l(e,t){for(var r=0;r<e.length;++r)t[r]=255&e.charCodeAt(r);return t}e("setimmediate"),a.newBlob=function(t,r){a.checkSupport("blob");try{return new Blob([t],{type:r})}catch(e){try{var n=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return n.append(t),n.getBlob(r)}catch(e){throw new Error("Bug : can't construct the Blob.")}}};var i={stringifyByChunk:function(e,t,r){var n=[],i=0,s=e.length;if(s<=r)return String.fromCharCode.apply(null,e);for(;i<s;)"array"===t||"nodebuffer"===t?n.push(String.fromCharCode.apply(null,e.slice(i,Math.min(i+r,s)))):n.push(String.fromCharCode.apply(null,e.subarray(i,Math.min(i+r,s)))),i+=r;return n.join("")},stringifyByChar:function(e){for(var t="",r=0;r<e.length;r++)t+=String.fromCharCode(e[r]);return t},applyCanBeUsed:{uint8array:function(){try{return o.uint8array&&1===String.fromCharCode.apply(null,new Uint8Array(1)).length}catch(e){return!1}}(),nodebuffer:function(){try{return o.nodebuffer&&1===String.fromCharCode.apply(null,r.allocBuffer(1)).length}catch(e){return!1}}()}};function s(e){var t=65536,r=a.getTypeOf(e),n=!0;if("uint8array"===r?n=i.applyCanBeUsed.uint8array:"nodebuffer"===r&&(n=i.applyCanBeUsed.nodebuffer),n)for(;1<t;)try{return i.stringifyByChunk(e,r,t)}catch(e){t=Math.floor(t/2)}return i.stringifyByChar(e)}function f(e,t){for(var r=0;r<e.length;r++)t[r]=e[r];return t}a.applyFromCharCode=s;var c={};c.string={string:n,array:function(e){return l(e,new Array(e.length))},arraybuffer:function(e){return c.string.uint8array(e).buffer},uint8array:function(e){return l(e,new Uint8Array(e.length))},nodebuffer:function(e){return l(e,r.allocBuffer(e.length))}},c.array={string:s,array:n,arraybuffer:function(e){return new Uint8Array(e).buffer},uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(e)}},c.arraybuffer={string:function(e){return s(new Uint8Array(e))},array:function(e){return f(new Uint8Array(e),new Array(e.byteLength))},arraybuffer:n,uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(new Uint8Array(e))}},c.uint8array={string:s,array:function(e){return f(e,new Array(e.length))},arraybuffer:function(e){return e.buffer},uint8array:n,nodebuffer:function(e){return r.newBufferFrom(e)}},c.nodebuffer={string:s,array:function(e){return f(e,new Array(e.length))},arraybuffer:function(e){return c.nodebuffer.uint8array(e).buffer},uint8array:function(e){return f(e,new Uint8Array(e.length))},nodebuffer:n},a.transformTo=function(e,t){if(t=t||"",!e)return t;a.checkSupport(e);var r=a.getTypeOf(t);return c[r][e](t)},a.resolve=function(e){for(var t=e.split("/"),r=[],n=0;n<t.length;n++){var i=t[n];"."===i||""===i&&0!==n&&n!==t.length-1||(".."===i?r.pop():r.push(i))}return r.join("/")},a.getTypeOf=function(e){return"string"==typeof e?"string":"[object Array]"===Object.prototype.toString.call(e)?"array":o.nodebuffer&&r.isBuffer(e)?"nodebuffer":o.uint8array&&e instanceof Uint8Array?"uint8array":o.arraybuffer&&e instanceof ArrayBuffer?"arraybuffer":void 0},a.checkSupport=function(e){if(!o[e.toLowerCase()])throw new Error(e+" is not supported by this platform")},a.MAX_VALUE_16BITS=65535,a.MAX_VALUE_32BITS=-1,a.pretty=function(e){var t,r,n="";for(r=0;r<(e||"").length;r++)n+="\\x"+((t=e.charCodeAt(r))<16?"0":"")+t.toString(16).toUpperCase();return n},a.delay=function(e,t,r){setImmediate(function(){e.apply(r||null,t||[])})},a.inherits=function(e,t){function r(){}r.prototype=t.prototype,e.prototype=new r},a.extend=function(){var e,t,r={};for(e=0;e<arguments.length;e++)for(t in arguments[e])Object.prototype.hasOwnProperty.call(arguments[e],t)&&void 0===r[t]&&(r[t]=arguments[e][t]);return r},a.prepareContent=function(r,e,n,i,s){return u.Promise.resolve(e).then(function(n){return o.blob&&(n instanceof Blob||-1!==["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(n)))&&"undefined"!=typeof FileReader?new u.Promise(function(t,r){var e=new FileReader;e.onload=function(e){t(e.target.result)},e.onerror=function(e){r(e.target.error)},e.readAsArrayBuffer(n)}):n}).then(function(e){var t=a.getTypeOf(e);return t?("arraybuffer"===t?e=a.transformTo("uint8array",e):"string"===t&&(s?e=h.decode(e):n&&!0!==i&&(e=function(e){return l(e,o.uint8array?new Uint8Array(e.length):new Array(e.length))}(e))),e):u.Promise.reject(new Error("Can't read the data of '"+r+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,setimmediate:54}],33:[function(e,t,r){"use strict";var n=e("./reader/readerFor"),i=e("./utils"),s=e("./signature"),a=e("./zipEntry"),o=e("./support");function h(e){this.files=[],this.loadOptions=e}h.prototype={checkSignature:function(e){if(!this.reader.readAndCheckSignature(e)){this.reader.index-=4;var t=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+i.pretty(t)+", expected "+i.pretty(e)+")")}},isSignature:function(e,t){var r=this.reader.index;this.reader.setIndex(e);var n=this.reader.readString(4)===t;return this.reader.setIndex(r),n},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var e=this.reader.readData(this.zipCommentLength),t=o.uint8array?"uint8array":"array",r=i.transformTo(t,e);this.zipComment=this.loadOptions.decodeFileName(r)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var e,t,r,n=this.zip64EndOfCentralSize-44;0<n;)e=this.reader.readInt(2),t=this.reader.readInt(4),r=this.reader.readData(t),this.zip64ExtensibleData[e]={id:e,length:t,value:r}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var e,t;for(e=0;e<this.files.length;e++)t=this.files[e],this.reader.setIndex(t.localHeaderOffset),this.checkSignature(s.LOCAL_FILE_HEADER),t.readLocalPart(this.reader),t.handleUTF8(),t.processAttributes()},readCentralDir:function(){var e;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER);)(e=new a({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(e);if(this.centralDirRecords!==this.files.length&&0!==this.centralDirRecords&&0===this.files.length)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var e=this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);if(e<0)throw!this.isSignature(0,s.LOCAL_FILE_HEADER)?new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html"):new Error("Corrupted zip: can't find end of central directory");this.reader.setIndex(e);var t=e;if(this.checkSignature(s.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===i.MAX_VALUE_16BITS||this.diskWithCentralDirStart===i.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===i.MAX_VALUE_16BITS||this.centralDirRecords===i.MAX_VALUE_16BITS||this.centralDirSize===i.MAX_VALUE_32BITS||this.centralDirOffset===i.MAX_VALUE_32BITS){if(this.zip64=!0,(e=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(e),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,s.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var r=this.centralDirOffset+this.centralDirSize;this.zip64&&(r+=20,r+=12+this.zip64EndOfCentralSize);var n=t-r;if(0<n)this.isSignature(t,s.CENTRAL_FILE_HEADER)||(this.reader.zero=n);else if(n<0)throw new Error("Corrupted zip: missing "+Math.abs(n)+" bytes.")},prepareReader:function(e){this.reader=n(e)},load:function(e){this.prepareReader(e),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},t.exports=h},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utils":32,"./zipEntry":34}],34:[function(e,t,r){"use strict";var n=e("./reader/readerFor"),s=e("./utils"),i=e("./compressedObject"),a=e("./crc32"),o=e("./utf8"),h=e("./compressions"),u=e("./support");function l(e,t){this.options=e,this.loadOptions=t}l.prototype={isEncrypted:function(){return 1==(1&this.bitFlag)},useUTF8:function(){return 2048==(2048&this.bitFlag)},readLocalPart:function(e){var t,r;if(e.skip(22),this.fileNameLength=e.readInt(2),r=e.readInt(2),this.fileName=e.readData(this.fileNameLength),e.skip(r),-1===this.compressedSize||-1===this.uncompressedSize)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if(null===(t=function(e){for(var t in h)if(Object.prototype.hasOwnProperty.call(h,t)&&h[t].magic===e)return h[t];return null}(this.compressionMethod)))throw new Error("Corrupted zip : compression "+s.pretty(this.compressionMethod)+" unknown (inner file : "+s.transformTo("string",this.fileName)+")");this.decompressed=new i(this.compressedSize,this.uncompressedSize,this.crc32,t,e.readData(this.compressedSize))},readCentralPart:function(e){this.versionMadeBy=e.readInt(2),e.skip(2),this.bitFlag=e.readInt(2),this.compressionMethod=e.readString(2),this.date=e.readDate(),this.crc32=e.readInt(4),this.compressedSize=e.readInt(4),this.uncompressedSize=e.readInt(4);var t=e.readInt(2);if(this.extraFieldsLength=e.readInt(2),this.fileCommentLength=e.readInt(2),this.diskNumberStart=e.readInt(2),this.internalFileAttributes=e.readInt(2),this.externalFileAttributes=e.readInt(4),this.localHeaderOffset=e.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");e.skip(t),this.readExtraFields(e),this.parseZIP64ExtraField(e),this.fileComment=e.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var e=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),0==e&&(this.dosPermissions=63&this.externalFileAttributes),3==e&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||"/"!==this.fileNameStr.slice(-1)||(this.dir=!0)},parseZIP64ExtraField:function(){if(this.extraFields[1]){var e=n(this.extraFields[1].value);this.uncompressedSize===s.MAX_VALUE_32BITS&&(this.uncompressedSize=e.readInt(8)),this.compressedSize===s.MAX_VALUE_32BITS&&(this.compressedSize=e.readInt(8)),this.localHeaderOffset===s.MAX_VALUE_32BITS&&(this.localHeaderOffset=e.readInt(8)),this.diskNumberStart===s.MAX_VALUE_32BITS&&(this.diskNumberStart=e.readInt(4))}},readExtraFields:function(e){var t,r,n,i=e.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});e.index+4<i;)t=e.readInt(2),r=e.readInt(2),n=e.readData(r),this.extraFields[t]={id:t,length:r,value:n};e.setIndex(i)},handleUTF8:function(){var e=u.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=o.utf8decode(this.fileName),this.fileCommentStr=o.utf8decode(this.fileComment);else{var t=this.findExtraFieldUnicodePath();if(null!==t)this.fileNameStr=t;else{var r=s.transformTo(e,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(r)}var n=this.findExtraFieldUnicodeComment();if(null!==n)this.fileCommentStr=n;else{var i=s.transformTo(e,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(i)}}},findExtraFieldUnicodePath:function(){var e=this.extraFields[28789];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:a(this.fileName)!==t.readInt(4)?null:o.utf8decode(t.readData(e.length-5))}return null},findExtraFieldUnicodeComment:function(){var e=this.extraFields[25461];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:a(this.fileComment)!==t.readInt(4)?null:o.utf8decode(t.readData(e.length-5))}return null}},t.exports=l},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(e,t,r){"use strict";function n(e,t,r){this.name=e,this.dir=r.dir,this.date=r.date,this.comment=r.comment,this.unixPermissions=r.unixPermissions,this.dosPermissions=r.dosPermissions,this._data=t,this._dataBinary=r.binary,this.options={compression:r.compression,compressionOptions:r.compressionOptions}}var s=e("./stream/StreamHelper"),i=e("./stream/DataWorker"),a=e("./utf8"),o=e("./compressedObject"),h=e("./stream/GenericWorker");n.prototype={internalStream:function(e){var t=null,r="string";try{if(!e)throw new Error("No output type specified.");var n="string"===(r=e.toLowerCase())||"text"===r;"binarystring"!==r&&"text"!==r||(r="string"),t=this._decompressWorker();var i=!this._dataBinary;i&&!n&&(t=t.pipe(new a.Utf8EncodeWorker)),!i&&n&&(t=t.pipe(new a.Utf8DecodeWorker))}catch(e){(t=new h("error")).error(e)}return new s(t,r,"")},async:function(e,t){return this.internalStream(e).accumulate(t)},nodeStream:function(e,t){return this.internalStream(e||"nodebuffer").toNodejsStream(t)},_compressWorker:function(e,t){if(this._data instanceof o&&this._data.compression.magic===e.magic)return this._data.getCompressedWorker();var r=this._decompressWorker();return this._dataBinary||(r=r.pipe(new a.Utf8EncodeWorker)),o.createWorkerFrom(r,e,t)},_decompressWorker:function(){return this._data instanceof o?this._data.getContentWorker():this._data instanceof h?this._data:new i(this._data)}};for(var u=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],l=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},f=0;f<u.length;f++)n.prototype[u[f]]=l;t.exports=n},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(e,l,t){(function(t){"use strict";var r,n,e=t.MutationObserver||t.WebKitMutationObserver;if(e){var i=0,s=new e(u),a=t.document.createTextNode("");s.observe(a,{characterData:!0}),r=function(){a.data=i=++i%2}}else if(t.setImmediate||void 0===t.MessageChannel)r="document"in t&&"onreadystatechange"in t.document.createElement("script")?function(){var e=t.document.createElement("script");e.onreadystatechange=function(){u(),e.onreadystatechange=null,e.parentNode.removeChild(e),e=null},t.document.documentElement.appendChild(e)}:function(){setTimeout(u,0)};else{var o=new t.MessageChannel;o.port1.onmessage=u,r=function(){o.port2.postMessage(0)}}var h=[];function u(){var e,t;n=!0;for(var r=h.length;r;){for(t=h,h=[],e=-1;++e<r;)t[e]();r=h.length}n=!1}l.exports=function(e){1!==h.push(e)||n||r()}}).call(this,"undefined"!=typeof __webpack_require__.g?__webpack_require__.g:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],37:[function(e,t,r){"use strict";var i=e("immediate");function u(){}var l={},s=["REJECTED"],a=["FULFILLED"],n=["PENDING"];function o(e){if("function"!=typeof e)throw new TypeError("resolver must be a function");this.state=n,this.queue=[],this.outcome=void 0,e!==u&&d(this,e)}function h(e,t,r){this.promise=e,"function"==typeof t&&(this.onFulfilled=t,this.callFulfilled=this.otherCallFulfilled),"function"==typeof r&&(this.onRejected=r,this.callRejected=this.otherCallRejected)}function f(t,r,n){i(function(){var e;try{e=r(n)}catch(e){return l.reject(t,e)}e===t?l.reject(t,new TypeError("Cannot resolve promise with itself")):l.resolve(t,e)})}function c(e){var t=e&&e.then;if(e&&("object"==typeof e||"function"==typeof e)&&"function"==typeof t)return function(){t.apply(e,arguments)}}function d(t,e){var r=!1;function n(e){r||(r=!0,l.reject(t,e))}function i(e){r||(r=!0,l.resolve(t,e))}var s=p(function(){e(i,n)});"error"===s.status&&n(s.value)}function p(e,t){var r={};try{r.value=e(t),r.status="success"}catch(e){r.status="error",r.value=e}return r}(t.exports=o).prototype.finally=function(t){if("function"!=typeof t)return this;var r=this.constructor;return this.then(function(e){return r.resolve(t()).then(function(){return e})},function(e){return r.resolve(t()).then(function(){throw e})})},o.prototype.catch=function(e){return this.then(null,e)},o.prototype.then=function(e,t){if("function"!=typeof e&&this.state===a||"function"!=typeof t&&this.state===s)return this;var r=new this.constructor(u);this.state!==n?f(r,this.state===a?e:t,this.outcome):this.queue.push(new h(r,e,t));return r},h.prototype.callFulfilled=function(e){l.resolve(this.promise,e)},h.prototype.otherCallFulfilled=function(e){f(this.promise,this.onFulfilled,e)},h.prototype.callRejected=function(e){l.reject(this.promise,e)},h.prototype.otherCallRejected=function(e){f(this.promise,this.onRejected,e)},l.resolve=function(e,t){var r=p(c,t);if("error"===r.status)return l.reject(e,r.value);var n=r.value;if(n)d(e,n);else{e.state=a,e.outcome=t;for(var i=-1,s=e.queue.length;++i<s;)e.queue[i].callFulfilled(t)}return e},l.reject=function(e,t){e.state=s,e.outcome=t;for(var r=-1,n=e.queue.length;++r<n;)e.queue[r].callRejected(t);return e},o.resolve=function(e){if(e instanceof this)return e;return l.resolve(new this(u),e)},o.reject=function(e){var t=new this(u);return l.reject(t,e)},o.all=function(e){var r=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var n=e.length,i=!1;if(!n)return this.resolve([]);var s=new Array(n),a=0,t=-1,o=new this(u);for(;++t<n;)h(e[t],t);return o;function h(e,t){r.resolve(e).then(function(e){s[t]=e,++a!==n||i||(i=!0,l.resolve(o,s))},function(e){i||(i=!0,l.reject(o,e))})}},o.race=function(e){var t=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var r=e.length,n=!1;if(!r)return this.resolve([]);var i=-1,s=new this(u);for(;++i<r;)a=e[i],t.resolve(a).then(function(e){n||(n=!0,l.resolve(s,e))},function(e){n||(n=!0,l.reject(s,e))});var a;return s}},{immediate:36}],38:[function(e,t,r){"use strict";var n={};(0,e("./lib/utils/common").assign)(n,e("./lib/deflate"),e("./lib/inflate"),e("./lib/zlib/constants")),t.exports=n},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(e,t,r){"use strict";var a=e("./zlib/deflate"),o=e("./utils/common"),h=e("./utils/strings"),i=e("./zlib/messages"),s=e("./zlib/zstream"),u=Object.prototype.toString,l=0,f=-1,c=0,d=8;function p(e){if(!(this instanceof p))return new p(e);this.options=o.assign({level:f,method:d,chunkSize:16384,windowBits:15,memLevel:8,strategy:c,to:""},e||{});var t=this.options;t.raw&&0<t.windowBits?t.windowBits=-t.windowBits:t.gzip&&0<t.windowBits&&t.windowBits<16&&(t.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new s,this.strm.avail_out=0;var r=a.deflateInit2(this.strm,t.level,t.method,t.windowBits,t.memLevel,t.strategy);if(r!==l)throw new Error(i[r]);if(t.header&&a.deflateSetHeader(this.strm,t.header),t.dictionary){var n;if(n="string"==typeof t.dictionary?h.string2buf(t.dictionary):"[object ArrayBuffer]"===u.call(t.dictionary)?new Uint8Array(t.dictionary):t.dictionary,(r=a.deflateSetDictionary(this.strm,n))!==l)throw new Error(i[r]);this._dict_set=!0}}function n(e,t){var r=new p(t);if(r.push(e,!0),r.err)throw r.msg||i[r.err];return r.result}p.prototype.push=function(e,t){var r,n,i=this.strm,s=this.options.chunkSize;if(this.ended)return!1;n=t===~~t?t:!0===t?4:0,"string"==typeof e?i.input=h.string2buf(e):"[object ArrayBuffer]"===u.call(e)?i.input=new Uint8Array(e):i.input=e,i.next_in=0,i.avail_in=i.input.length;do{if(0===i.avail_out&&(i.output=new o.Buf8(s),i.next_out=0,i.avail_out=s),1!==(r=a.deflate(i,n))&&r!==l)return this.onEnd(r),!(this.ended=!0);0!==i.avail_out&&(0!==i.avail_in||4!==n&&2!==n)||("string"===this.options.to?this.onData(h.buf2binstring(o.shrinkBuf(i.output,i.next_out))):this.onData(o.shrinkBuf(i.output,i.next_out)))}while((0<i.avail_in||0===i.avail_out)&&1!==r);return 4===n?(r=a.deflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===l):2!==n||(this.onEnd(l),!(i.avail_out=0))},p.prototype.onData=function(e){this.chunks.push(e)},p.prototype.onEnd=function(e){e===l&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},r.Deflate=p,r.deflate=n,r.deflateRaw=function(e,t){return(t=t||{}).raw=!0,n(e,t)},r.gzip=function(e,t){return(t=t||{}).gzip=!0,n(e,t)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(e,t,r){"use strict";var c=e("./zlib/inflate"),d=e("./utils/common"),p=e("./utils/strings"),m=e("./zlib/constants"),n=e("./zlib/messages"),i=e("./zlib/zstream"),s=e("./zlib/gzheader"),_=Object.prototype.toString;function a(e){if(!(this instanceof a))return new a(e);this.options=d.assign({chunkSize:16384,windowBits:0,to:""},e||{});var t=this.options;t.raw&&0<=t.windowBits&&t.windowBits<16&&(t.windowBits=-t.windowBits,0===t.windowBits&&(t.windowBits=-15)),!(0<=t.windowBits&&t.windowBits<16)||e&&e.windowBits||(t.windowBits+=32),15<t.windowBits&&t.windowBits<48&&0==(15&t.windowBits)&&(t.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new i,this.strm.avail_out=0;var r=c.inflateInit2(this.strm,t.windowBits);if(r!==m.Z_OK)throw new Error(n[r]);this.header=new s,c.inflateGetHeader(this.strm,this.header)}function o(e,t){var r=new a(t);if(r.push(e,!0),r.err)throw r.msg||n[r.err];return r.result}a.prototype.push=function(e,t){var r,n,i,s,a,o,h=this.strm,u=this.options.chunkSize,l=this.options.dictionary,f=!1;if(this.ended)return!1;n=t===~~t?t:!0===t?m.Z_FINISH:m.Z_NO_FLUSH,"string"==typeof e?h.input=p.binstring2buf(e):"[object ArrayBuffer]"===_.call(e)?h.input=new Uint8Array(e):h.input=e,h.next_in=0,h.avail_in=h.input.length;do{if(0===h.avail_out&&(h.output=new d.Buf8(u),h.next_out=0,h.avail_out=u),(r=c.inflate(h,m.Z_NO_FLUSH))===m.Z_NEED_DICT&&l&&(o="string"==typeof l?p.string2buf(l):"[object ArrayBuffer]"===_.call(l)?new Uint8Array(l):l,r=c.inflateSetDictionary(this.strm,o)),r===m.Z_BUF_ERROR&&!0===f&&(r=m.Z_OK,f=!1),r!==m.Z_STREAM_END&&r!==m.Z_OK)return this.onEnd(r),!(this.ended=!0);h.next_out&&(0!==h.avail_out&&r!==m.Z_STREAM_END&&(0!==h.avail_in||n!==m.Z_FINISH&&n!==m.Z_SYNC_FLUSH)||("string"===this.options.to?(i=p.utf8border(h.output,h.next_out),s=h.next_out-i,a=p.buf2string(h.output,i),h.next_out=s,h.avail_out=u-s,s&&d.arraySet(h.output,h.output,i,s,0),this.onData(a)):this.onData(d.shrinkBuf(h.output,h.next_out)))),0===h.avail_in&&0===h.avail_out&&(f=!0)}while((0<h.avail_in||0===h.avail_out)&&r!==m.Z_STREAM_END);return r===m.Z_STREAM_END&&(n=m.Z_FINISH),n===m.Z_FINISH?(r=c.inflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===m.Z_OK):n!==m.Z_SYNC_FLUSH||(this.onEnd(m.Z_OK),!(h.avail_out=0))},a.prototype.onData=function(e){this.chunks.push(e)},a.prototype.onEnd=function(e){e===m.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=d.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},r.Inflate=a,r.inflate=o,r.inflateRaw=function(e,t){return(t=t||{}).raw=!0,o(e,t)},r.ungzip=o},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(e,t,r){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;r.assign=function(e){for(var t=Array.prototype.slice.call(arguments,1);t.length;){var r=t.shift();if(r){if("object"!=typeof r)throw new TypeError(r+"must be non-object");for(var n in r)r.hasOwnProperty(n)&&(e[n]=r[n])}}return e},r.shrinkBuf=function(e,t){return e.length===t?e:e.subarray?e.subarray(0,t):(e.length=t,e)};var i={arraySet:function(e,t,r,n,i){if(t.subarray&&e.subarray)e.set(t.subarray(r,r+n),i);else for(var s=0;s<n;s++)e[i+s]=t[r+s]},flattenChunks:function(e){var t,r,n,i,s,a;for(t=n=0,r=e.length;t<r;t++)n+=e[t].length;for(a=new Uint8Array(n),t=i=0,r=e.length;t<r;t++)s=e[t],a.set(s,i),i+=s.length;return a}},s={arraySet:function(e,t,r,n,i){for(var s=0;s<n;s++)e[i+s]=t[r+s]},flattenChunks:function(e){return[].concat.apply([],e)}};r.setTyped=function(e){e?(r.Buf8=Uint8Array,r.Buf16=Uint16Array,r.Buf32=Int32Array,r.assign(r,i)):(r.Buf8=Array,r.Buf16=Array,r.Buf32=Array,r.assign(r,s))},r.setTyped(n)},{}],42:[function(e,t,r){"use strict";var h=e("./common"),i=!0,s=!0;try{String.fromCharCode.apply(null,[0])}catch(e){i=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(e){s=!1}for(var u=new h.Buf8(256),n=0;n<256;n++)u[n]=252<=n?6:248<=n?5:240<=n?4:224<=n?3:192<=n?2:1;function l(e,t){if(t<65537&&(e.subarray&&s||!e.subarray&&i))return String.fromCharCode.apply(null,h.shrinkBuf(e,t));for(var r="",n=0;n<t;n++)r+=String.fromCharCode(e[n]);return r}u[254]=u[254]=1,r.string2buf=function(e){var t,r,n,i,s,a=e.length,o=0;for(i=0;i<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),o+=r<128?1:r<2048?2:r<65536?3:4;for(t=new h.Buf8(o),i=s=0;s<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t},r.buf2binstring=function(e){return l(e,e.length)},r.binstring2buf=function(e){for(var t=new h.Buf8(e.length),r=0,n=t.length;r<n;r++)t[r]=e.charCodeAt(r);return t},r.buf2string=function(e,t){var r,n,i,s,a=t||e.length,o=new Array(2*a);for(r=n=0;r<a;)if((i=e[r++])<128)o[n++]=i;else if(4<(s=u[i]))o[n++]=65533,r+=s-1;else{for(i&=2===s?31:3===s?15:7;1<s&&r<a;)i=i<<6|63&e[r++],s--;1<s?o[n++]=65533:i<65536?o[n++]=i:(i-=65536,o[n++]=55296|i>>10&1023,o[n++]=56320|1023&i)}return l(o,n)},r.utf8border=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t}},{"./common":41}],43:[function(e,t,r){"use strict";t.exports=function(e,t,r,n){for(var i=65535&e|0,s=e>>>16&65535|0,a=0;0!==r;){for(r-=a=2e3<r?2e3:r;s=s+(i=i+t[n++]|0)|0,--a;);i%=65521,s%=65521}return i|s<<16|0}},{}],44:[function(e,t,r){"use strict";t.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(e,t,r){"use strict";var o=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e}return t}();t.exports=function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t[a])];return-1^e}},{}],46:[function(e,t,r){"use strict";var h,c=e("../utils/common"),u=e("./trees"),d=e("./adler32"),p=e("./crc32"),n=e("./messages"),l=0,f=4,m=0,_=-2,g=-1,b=4,i=2,v=8,y=9,s=286,a=30,o=19,w=2*s+1,k=15,x=3,S=258,z=S+x+1,C=42,E=113,A=1,I=2,O=3,B=4;function R(e,t){return e.msg=n[t],t}function T(e){return(e<<1)-(4<e?9:0)}function D(e){for(var t=e.length;0<=--t;)e[t]=0}function F(e){var t=e.state,r=t.pending;r>e.avail_out&&(r=e.avail_out),0!==r&&(c.arraySet(e.output,t.pending_buf,t.pending_out,r,e.next_out),e.next_out+=r,t.pending_out+=r,e.total_out+=r,e.avail_out-=r,t.pending-=r,0===t.pending&&(t.pending_out=0))}function N(e,t){u._tr_flush_block(e,0<=e.block_start?e.block_start:-1,e.strstart-e.block_start,t),e.block_start=e.strstart,F(e.strm)}function U(e,t){e.pending_buf[e.pending++]=t}function P(e,t){e.pending_buf[e.pending++]=t>>>8&255,e.pending_buf[e.pending++]=255&t}function L(e,t){var r,n,i=e.max_chain_length,s=e.strstart,a=e.prev_length,o=e.nice_match,h=e.strstart>e.w_size-z?e.strstart-(e.w_size-z):0,u=e.window,l=e.w_mask,f=e.prev,c=e.strstart+S,d=u[s+a-1],p=u[s+a];e.prev_length>=e.good_match&&(i>>=2),o>e.lookahead&&(o=e.lookahead);do{if(u[(r=t)+a]===p&&u[r+a-1]===d&&u[r]===u[s]&&u[++r]===u[s+1]){s+=2,r++;do{}while(u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&s<c);if(n=S-(c-s),s=c-S,a<n){if(e.match_start=t,o<=(a=n))break;d=u[s+a-1],p=u[s+a]}}}while((t=f[t&l])>h&&0!=--i);return a<=e.lookahead?a:e.lookahead}function j(e){var t,r,n,i,s,a,o,h,u,l,f=e.w_size;do{if(i=e.window_size-e.lookahead-e.strstart,e.strstart>=f+(f-z)){for(c.arraySet(e.window,e.window,f,f,0),e.match_start-=f,e.strstart-=f,e.block_start-=f,t=r=e.hash_size;n=e.head[--t],e.head[t]=f<=n?n-f:0,--r;);for(t=r=f;n=e.prev[--t],e.prev[t]=f<=n?n-f:0,--r;);i+=f}if(0===e.strm.avail_in)break;if(a=e.strm,o=e.window,h=e.strstart+e.lookahead,u=i,l=void 0,l=a.avail_in,u<l&&(l=u),r=0===l?0:(a.avail_in-=l,c.arraySet(o,a.input,a.next_in,l,h),1===a.state.wrap?a.adler=d(a.adler,o,l,h):2===a.state.wrap&&(a.adler=p(a.adler,o,l,h)),a.next_in+=l,a.total_in+=l,l),e.lookahead+=r,e.lookahead+e.insert>=x)for(s=e.strstart-e.insert,e.ins_h=e.window[s],e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+1])&e.hash_mask;e.insert&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+x-1])&e.hash_mask,e.prev[s&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=s,s++,e.insert--,!(e.lookahead+e.insert<x)););}while(e.lookahead<z&&0!==e.strm.avail_in)}function Z(e,t){for(var r,n;;){if(e.lookahead<z){if(j(e),e.lookahead<z&&t===l)return A;if(0===e.lookahead)break}if(r=0,e.lookahead>=x&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!==r&&e.strstart-r<=e.w_size-z&&(e.match_length=L(e,r)),e.match_length>=x)if(n=u._tr_tally(e,e.strstart-e.match_start,e.match_length-x),e.lookahead-=e.match_length,e.match_length<=e.max_lazy_match&&e.lookahead>=x){for(e.match_length--;e.strstart++,e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart,0!=--e.match_length;);e.strstart++}else e.strstart+=e.match_length,e.match_length=0,e.ins_h=e.window[e.strstart],e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+1])&e.hash_mask;else n=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++;if(n&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=e.strstart<x-1?e.strstart:x-1,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}function W(e,t){for(var r,n,i;;){if(e.lookahead<z){if(j(e),e.lookahead<z&&t===l)return A;if(0===e.lookahead)break}if(r=0,e.lookahead>=x&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),e.prev_length=e.match_length,e.prev_match=e.match_start,e.match_length=x-1,0!==r&&e.prev_length<e.max_lazy_match&&e.strstart-r<=e.w_size-z&&(e.match_length=L(e,r),e.match_length<=5&&(1===e.strategy||e.match_length===x&&4096<e.strstart-e.match_start)&&(e.match_length=x-1)),e.prev_length>=x&&e.match_length<=e.prev_length){for(i=e.strstart+e.lookahead-x,n=u._tr_tally(e,e.strstart-1-e.prev_match,e.prev_length-x),e.lookahead-=e.prev_length-1,e.prev_length-=2;++e.strstart<=i&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!=--e.prev_length;);if(e.match_available=0,e.match_length=x-1,e.strstart++,n&&(N(e,!1),0===e.strm.avail_out))return A}else if(e.match_available){if((n=u._tr_tally(e,0,e.window[e.strstart-1]))&&N(e,!1),e.strstart++,e.lookahead--,0===e.strm.avail_out)return A}else e.match_available=1,e.strstart++,e.lookahead--}return e.match_available&&(n=u._tr_tally(e,0,e.window[e.strstart-1]),e.match_available=0),e.insert=e.strstart<x-1?e.strstart:x-1,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}function M(e,t,r,n,i){this.good_length=e,this.max_lazy=t,this.nice_length=r,this.max_chain=n,this.func=i}function H(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=v,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new c.Buf16(2*w),this.dyn_dtree=new c.Buf16(2*(2*a+1)),this.bl_tree=new c.Buf16(2*(2*o+1)),D(this.dyn_ltree),D(this.dyn_dtree),D(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new c.Buf16(k+1),this.heap=new c.Buf16(2*s+1),D(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new c.Buf16(2*s+1),D(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function G(e){var t;return e&&e.state?(e.total_in=e.total_out=0,e.data_type=i,(t=e.state).pending=0,t.pending_out=0,t.wrap<0&&(t.wrap=-t.wrap),t.status=t.wrap?C:E,e.adler=2===t.wrap?0:1,t.last_flush=l,u._tr_init(t),m):R(e,_)}function K(e){var t=G(e);return t===m&&function(e){e.window_size=2*e.w_size,D(e.head),e.max_lazy_match=h[e.level].max_lazy,e.good_match=h[e.level].good_length,e.nice_match=h[e.level].nice_length,e.max_chain_length=h[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=x-1,e.match_available=0,e.ins_h=0}(e.state),t}function Y(e,t,r,n,i,s){if(!e)return _;var a=1;if(t===g&&(t=6),n<0?(a=0,n=-n):15<n&&(a=2,n-=16),i<1||y<i||r!==v||n<8||15<n||t<0||9<t||s<0||b<s)return R(e,_);8===n&&(n=9);var o=new H;return(e.state=o).strm=e,o.wrap=a,o.gzhead=null,o.w_bits=n,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=i+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+x-1)/x),o.window=new c.Buf8(2*o.w_size),o.head=new c.Buf16(o.hash_size),o.prev=new c.Buf16(o.w_size),o.lit_bufsize=1<<i+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new c.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=t,o.strategy=s,o.method=r,K(e)}h=[new M(0,0,0,0,function(e,t){var r=65535;for(r>e.pending_buf_size-5&&(r=e.pending_buf_size-5);;){if(e.lookahead<=1){if(j(e),0===e.lookahead&&t===l)return A;if(0===e.lookahead)break}e.strstart+=e.lookahead,e.lookahead=0;var n=e.block_start+r;if((0===e.strstart||e.strstart>=n)&&(e.lookahead=e.strstart-n,e.strstart=n,N(e,!1),0===e.strm.avail_out))return A;if(e.strstart-e.block_start>=e.w_size-z&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):(e.strstart>e.block_start&&(N(e,!1),e.strm.avail_out),A)}),new M(4,4,8,4,Z),new M(4,5,16,8,Z),new M(4,6,32,32,Z),new M(4,4,16,16,W),new M(8,16,32,32,W),new M(8,16,128,128,W),new M(8,32,128,256,W),new M(32,128,258,1024,W),new M(32,258,258,4096,W)],r.deflateInit=function(e,t){return Y(e,t,v,15,8,0)},r.deflateInit2=Y,r.deflateReset=K,r.deflateResetKeep=G,r.deflateSetHeader=function(e,t){return e&&e.state?2!==e.state.wrap?_:(e.state.gzhead=t,m):_},r.deflate=function(e,t){var r,n,i,s;if(!e||!e.state||5<t||t<0)return e?R(e,_):_;if(n=e.state,!e.output||!e.input&&0!==e.avail_in||666===n.status&&t!==f)return R(e,0===e.avail_out?-5:_);if(n.strm=e,r=n.last_flush,n.last_flush=t,n.status===C)if(2===n.wrap)e.adler=0,U(n,31),U(n,139),U(n,8),n.gzhead?(U(n,(n.gzhead.text?1:0)+(n.gzhead.hcrc?2:0)+(n.gzhead.extra?4:0)+(n.gzhead.name?8:0)+(n.gzhead.comment?16:0)),U(n,255&n.gzhead.time),U(n,n.gzhead.time>>8&255),U(n,n.gzhead.time>>16&255),U(n,n.gzhead.time>>24&255),U(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),U(n,255&n.gzhead.os),n.gzhead.extra&&n.gzhead.extra.length&&(U(n,255&n.gzhead.extra.length),U(n,n.gzhead.extra.length>>8&255)),n.gzhead.hcrc&&(e.adler=p(e.adler,n.pending_buf,n.pending,0)),n.gzindex=0,n.status=69):(U(n,0),U(n,0),U(n,0),U(n,0),U(n,0),U(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),U(n,3),n.status=E);else{var a=v+(n.w_bits-8<<4)<<8;a|=(2<=n.strategy||n.level<2?0:n.level<6?1:6===n.level?2:3)<<6,0!==n.strstart&&(a|=32),a+=31-a%31,n.status=E,P(n,a),0!==n.strstart&&(P(n,e.adler>>>16),P(n,65535&e.adler)),e.adler=1}if(69===n.status)if(n.gzhead.extra){for(i=n.pending;n.gzindex<(65535&n.gzhead.extra.length)&&(n.pending!==n.pending_buf_size||(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending!==n.pending_buf_size));)U(n,255&n.gzhead.extra[n.gzindex]),n.gzindex++;n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),n.gzindex===n.gzhead.extra.length&&(n.gzindex=0,n.status=73)}else n.status=73;if(73===n.status)if(n.gzhead.name){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.name.length?255&n.gzhead.name.charCodeAt(n.gzindex++):0,U(n,s)}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.gzindex=0,n.status=91)}else n.status=91;if(91===n.status)if(n.gzhead.comment){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.comment.length?255&n.gzhead.comment.charCodeAt(n.gzindex++):0,U(n,s)}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.status=103)}else n.status=103;if(103===n.status&&(n.gzhead.hcrc?(n.pending+2>n.pending_buf_size&&F(e),n.pending+2<=n.pending_buf_size&&(U(n,255&e.adler),U(n,e.adler>>8&255),e.adler=0,n.status=E)):n.status=E),0!==n.pending){if(F(e),0===e.avail_out)return n.last_flush=-1,m}else if(0===e.avail_in&&T(t)<=T(r)&&t!==f)return R(e,-5);if(666===n.status&&0!==e.avail_in)return R(e,-5);if(0!==e.avail_in||0!==n.lookahead||t!==l&&666!==n.status){var o=2===n.strategy?function(e,t){for(var r;;){if(0===e.lookahead&&(j(e),0===e.lookahead)){if(t===l)return A;break}if(e.match_length=0,r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++,r&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}(n,t):3===n.strategy?function(e,t){for(var r,n,i,s,a=e.window;;){if(e.lookahead<=S){if(j(e),e.lookahead<=S&&t===l)return A;if(0===e.lookahead)break}if(e.match_length=0,e.lookahead>=x&&0<e.strstart&&(n=a[i=e.strstart-1])===a[++i]&&n===a[++i]&&n===a[++i]){s=e.strstart+S;do{}while(n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&i<s);e.match_length=S-(s-i),e.match_length>e.lookahead&&(e.match_length=e.lookahead)}if(e.match_length>=x?(r=u._tr_tally(e,1,e.match_length-x),e.lookahead-=e.match_length,e.strstart+=e.match_length,e.match_length=0):(r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++),r&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}(n,t):h[n.level].func(n,t);if(o!==O&&o!==B||(n.status=666),o===A||o===O)return 0===e.avail_out&&(n.last_flush=-1),m;if(o===I&&(1===t?u._tr_align(n):5!==t&&(u._tr_stored_block(n,0,0,!1),3===t&&(D(n.head),0===n.lookahead&&(n.strstart=0,n.block_start=0,n.insert=0))),F(e),0===e.avail_out))return n.last_flush=-1,m}return t!==f?m:n.wrap<=0?1:(2===n.wrap?(U(n,255&e.adler),U(n,e.adler>>8&255),U(n,e.adler>>16&255),U(n,e.adler>>24&255),U(n,255&e.total_in),U(n,e.total_in>>8&255),U(n,e.total_in>>16&255),U(n,e.total_in>>24&255)):(P(n,e.adler>>>16),P(n,65535&e.adler)),F(e),0<n.wrap&&(n.wrap=-n.wrap),0!==n.pending?m:1)},r.deflateEnd=function(e){var t;return e&&e.state?(t=e.state.status)!==C&&69!==t&&73!==t&&91!==t&&103!==t&&t!==E&&666!==t?R(e,_):(e.state=null,t===E?R(e,-3):m):_},r.deflateSetDictionary=function(e,t){var r,n,i,s,a,o,h,u,l=t.length;if(!e||!e.state)return _;if(2===(s=(r=e.state).wrap)||1===s&&r.status!==C||r.lookahead)return _;for(1===s&&(e.adler=d(e.adler,t,l,0)),r.wrap=0,l>=r.w_size&&(0===s&&(D(r.head),r.strstart=0,r.block_start=0,r.insert=0),u=new c.Buf8(r.w_size),c.arraySet(u,t,l-r.w_size,r.w_size,0),t=u,l=r.w_size),a=e.avail_in,o=e.next_in,h=e.input,e.avail_in=l,e.next_in=0,e.input=t,j(r);r.lookahead>=x;){for(n=r.strstart,i=r.lookahead-(x-1);r.ins_h=(r.ins_h<<r.hash_shift^r.window[n+x-1])&r.hash_mask,r.prev[n&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=n,n++,--i;);r.strstart=n,r.lookahead=x-1,j(r)}return r.strstart+=r.lookahead,r.block_start=r.strstart,r.insert=r.lookahead,r.lookahead=0,r.match_length=r.prev_length=x-1,r.match_available=0,e.next_in=o,e.input=h,e.avail_in=a,r.wrap=s,m},r.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(e,t,r){"use strict";t.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],48:[function(e,t,r){"use strict";t.exports=function(e,t){var r,n,i,s,a,o,h,u,l,f,c,d,p,m,_,g,b,v,y,w,k,x,S,z,C;r=e.state,n=e.next_in,z=e.input,i=n+(e.avail_in-5),s=e.next_out,C=e.output,a=s-(t-e.avail_out),o=s+(e.avail_out-257),h=r.dmax,u=r.wsize,l=r.whave,f=r.wnext,c=r.window,d=r.hold,p=r.bits,m=r.lencode,_=r.distcode,g=(1<<r.lenbits)-1,b=(1<<r.distbits)-1;e:do{p<15&&(d+=z[n++]<<p,p+=8,d+=z[n++]<<p,p+=8),v=m[d&g];t:for(;;){if(d>>>=y=v>>>24,p-=y,0===(y=v>>>16&255))C[s++]=65535&v;else{if(!(16&y)){if(0==(64&y)){v=m[(65535&v)+(d&(1<<y)-1)];continue t}if(32&y){r.mode=12;break e}e.msg="invalid literal/length code",r.mode=30;break e}w=65535&v,(y&=15)&&(p<y&&(d+=z[n++]<<p,p+=8),w+=d&(1<<y)-1,d>>>=y,p-=y),p<15&&(d+=z[n++]<<p,p+=8,d+=z[n++]<<p,p+=8),v=_[d&b];r:for(;;){if(d>>>=y=v>>>24,p-=y,!(16&(y=v>>>16&255))){if(0==(64&y)){v=_[(65535&v)+(d&(1<<y)-1)];continue r}e.msg="invalid distance code",r.mode=30;break e}if(k=65535&v,p<(y&=15)&&(d+=z[n++]<<p,(p+=8)<y&&(d+=z[n++]<<p,p+=8)),h<(k+=d&(1<<y)-1)){e.msg="invalid distance too far back",r.mode=30;break e}if(d>>>=y,p-=y,(y=s-a)<k){if(l<(y=k-y)&&r.sane){e.msg="invalid distance too far back",r.mode=30;break e}if(S=c,(x=0)===f){if(x+=u-y,y<w){for(w-=y;C[s++]=c[x++],--y;);x=s-k,S=C}}else if(f<y){if(x+=u+f-y,(y-=f)<w){for(w-=y;C[s++]=c[x++],--y;);if(x=0,f<w){for(w-=y=f;C[s++]=c[x++],--y;);x=s-k,S=C}}}else if(x+=f-y,y<w){for(w-=y;C[s++]=c[x++],--y;);x=s-k,S=C}for(;2<w;)C[s++]=S[x++],C[s++]=S[x++],C[s++]=S[x++],w-=3;w&&(C[s++]=S[x++],1<w&&(C[s++]=S[x++]))}else{for(x=s-k;C[s++]=C[x++],C[s++]=C[x++],C[s++]=C[x++],2<(w-=3););w&&(C[s++]=C[x++],1<w&&(C[s++]=C[x++]))}break}}break}}while(n<i&&s<o);n-=w=p>>3,d&=(1<<(p-=w<<3))-1,e.next_in=n,e.next_out=s,e.avail_in=n<i?i-n+5:5-(n-i),e.avail_out=s<o?o-s+257:257-(s-o),r.hold=d,r.bits=p}},{}],49:[function(e,t,r){"use strict";var I=e("../utils/common"),O=e("./adler32"),B=e("./crc32"),R=e("./inffast"),T=e("./inftrees"),D=1,F=2,N=0,U=-2,P=1,n=852,i=592;function L(e){return(e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24)}function s(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new I.Buf16(320),this.work=new I.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function a(e){var t;return e&&e.state?(t=e.state,e.total_in=e.total_out=t.total=0,e.msg="",t.wrap&&(e.adler=1&t.wrap),t.mode=P,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new I.Buf32(n),t.distcode=t.distdyn=new I.Buf32(i),t.sane=1,t.back=-1,N):U}function o(e){var t;return e&&e.state?((t=e.state).wsize=0,t.whave=0,t.wnext=0,a(e)):U}function h(e,t){var r,n;return e&&e.state?(n=e.state,t<0?(r=0,t=-t):(r=1+(t>>4),t<48&&(t&=15)),t&&(t<8||15<t)?U:(null!==n.window&&n.wbits!==t&&(n.window=null),n.wrap=r,n.wbits=t,o(e))):U}function u(e,t){var r,n;return e?(n=new s,(e.state=n).window=null,(r=h(e,t))!==N&&(e.state=null),r):U}var l,f,c=!0;function j(e){if(c){var t;for(l=new I.Buf32(512),f=new I.Buf32(32),t=0;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(T(D,e.lens,0,288,l,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;T(F,e.lens,0,32,f,0,e.work,{bits:5}),c=!1}e.lencode=l,e.lenbits=9,e.distcode=f,e.distbits=5}function Z(e,t,r,n){var i,s=e.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new I.Buf8(s.wsize)),n>=s.wsize?(I.arraySet(s.window,t,r-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):(n<(i=s.wsize-s.wnext)&&(i=n),I.arraySet(s.window,t,r-n,i,s.wnext),(n-=i)?(I.arraySet(s.window,t,r-n,n,0),s.wnext=n,s.whave=s.wsize):(s.wnext+=i,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=i))),0}r.inflateReset=o,r.inflateReset2=h,r.inflateResetKeep=a,r.inflateInit=function(e){return u(e,15)},r.inflateInit2=u,r.inflate=function(e,t){var r,n,i,s,a,o,h,u,l,f,c,d,p,m,_,g,b,v,y,w,k,x,S,z,C=0,E=new I.Buf8(4),A=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!e||!e.state||!e.output||!e.input&&0!==e.avail_in)return U;12===(r=e.state).mode&&(r.mode=13),a=e.next_out,i=e.output,h=e.avail_out,s=e.next_in,n=e.input,o=e.avail_in,u=r.hold,l=r.bits,f=o,c=h,x=N;e:for(;;)switch(r.mode){case P:if(0===r.wrap){r.mode=13;break}for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(2&r.wrap&&35615===u){E[r.check=0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0),l=u=0,r.mode=2;break}if(r.flags=0,r.head&&(r.head.done=!1),!(1&r.wrap)||(((255&u)<<8)+(u>>8))%31){e.msg="incorrect header check",r.mode=30;break}if(8!=(15&u)){e.msg="unknown compression method",r.mode=30;break}if(l-=4,k=8+(15&(u>>>=4)),0===r.wbits)r.wbits=k;else if(k>r.wbits){e.msg="invalid window size",r.mode=30;break}r.dmax=1<<k,e.adler=r.check=1,r.mode=512&u?10:12,l=u=0;break;case 2:for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(r.flags=u,8!=(255&r.flags)){e.msg="unknown compression method",r.mode=30;break}if(57344&r.flags){e.msg="unknown header flags set",r.mode=30;break}r.head&&(r.head.text=u>>8&1),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=3;case 3:for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.head&&(r.head.time=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,E[2]=u>>>16&255,E[3]=u>>>24&255,r.check=B(r.check,E,4,0)),l=u=0,r.mode=4;case 4:for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.head&&(r.head.xflags=255&u,r.head.os=u>>8),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=5;case 5:if(1024&r.flags){for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.length=u,r.head&&(r.head.extra_len=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0}else r.head&&(r.head.extra=null);r.mode=6;case 6:if(1024&r.flags&&(o<(d=r.length)&&(d=o),d&&(r.head&&(k=r.head.extra_len-r.length,r.head.extra||(r.head.extra=new Array(r.head.extra_len)),I.arraySet(r.head.extra,n,s,d,k)),512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,r.length-=d),r.length))break e;r.length=0,r.mode=7;case 7:if(2048&r.flags){if(0===o)break e;for(d=0;k=n[s+d++],r.head&&k&&r.length<65536&&(r.head.name+=String.fromCharCode(k)),k&&d<o;);if(512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,k)break e}else r.head&&(r.head.name=null);r.length=0,r.mode=8;case 8:if(4096&r.flags){if(0===o)break e;for(d=0;k=n[s+d++],r.head&&k&&r.length<65536&&(r.head.comment+=String.fromCharCode(k)),k&&d<o;);if(512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,k)break e}else r.head&&(r.head.comment=null);r.mode=9;case 9:if(512&r.flags){for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u!==(65535&r.check)){e.msg="header crc mismatch",r.mode=30;break}l=u=0}r.head&&(r.head.hcrc=r.flags>>9&1,r.head.done=!0),e.adler=r.check=0,r.mode=12;break;case 10:for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}e.adler=r.check=L(u),l=u=0,r.mode=11;case 11:if(0===r.havedict)return e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,2;e.adler=r.check=1,r.mode=12;case 12:if(5===t||6===t)break e;case 13:if(r.last){u>>>=7&l,l-=7&l,r.mode=27;break}for(;l<3;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}switch(r.last=1&u,l-=1,3&(u>>>=1)){case 0:r.mode=14;break;case 1:if(j(r),r.mode=20,6!==t)break;u>>>=2,l-=2;break e;case 2:r.mode=17;break;case 3:e.msg="invalid block type",r.mode=30}u>>>=2,l-=2;break;case 14:for(u>>>=7&l,l-=7&l;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if((65535&u)!=(u>>>16^65535)){e.msg="invalid stored block lengths",r.mode=30;break}if(r.length=65535&u,l=u=0,r.mode=15,6===t)break e;case 15:r.mode=16;case 16:if(d=r.length){if(o<d&&(d=o),h<d&&(d=h),0===d)break e;I.arraySet(i,n,s,d,a),o-=d,s+=d,h-=d,a+=d,r.length-=d;break}r.mode=12;break;case 17:for(;l<14;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(r.nlen=257+(31&u),u>>>=5,l-=5,r.ndist=1+(31&u),u>>>=5,l-=5,r.ncode=4+(15&u),u>>>=4,l-=4,286<r.nlen||30<r.ndist){e.msg="too many length or distance symbols",r.mode=30;break}r.have=0,r.mode=18;case 18:for(;r.have<r.ncode;){for(;l<3;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.lens[A[r.have++]]=7&u,u>>>=3,l-=3}for(;r.have<19;)r.lens[A[r.have++]]=0;if(r.lencode=r.lendyn,r.lenbits=7,S={bits:r.lenbits},x=T(0,r.lens,0,19,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid code lengths set",r.mode=30;break}r.have=0,r.mode=19;case 19:for(;r.have<r.nlen+r.ndist;){for(;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(b<16)u>>>=_,l-=_,r.lens[r.have++]=b;else{if(16===b){for(z=_+2;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u>>>=_,l-=_,0===r.have){e.msg="invalid bit length repeat",r.mode=30;break}k=r.lens[r.have-1],d=3+(3&u),u>>>=2,l-=2}else if(17===b){for(z=_+3;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}l-=_,k=0,d=3+(7&(u>>>=_)),u>>>=3,l-=3}else{for(z=_+7;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}l-=_,k=0,d=11+(127&(u>>>=_)),u>>>=7,l-=7}if(r.have+d>r.nlen+r.ndist){e.msg="invalid bit length repeat",r.mode=30;break}for(;d--;)r.lens[r.have++]=k}}if(30===r.mode)break;if(0===r.lens[256]){e.msg="invalid code -- missing end-of-block",r.mode=30;break}if(r.lenbits=9,S={bits:r.lenbits},x=T(D,r.lens,0,r.nlen,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid literal/lengths set",r.mode=30;break}if(r.distbits=6,r.distcode=r.distdyn,S={bits:r.distbits},x=T(F,r.lens,r.nlen,r.ndist,r.distcode,0,r.work,S),r.distbits=S.bits,x){e.msg="invalid distances set",r.mode=30;break}if(r.mode=20,6===t)break e;case 20:r.mode=21;case 21:if(6<=o&&258<=h){e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,R(e,c),a=e.next_out,i=e.output,h=e.avail_out,s=e.next_in,n=e.input,o=e.avail_in,u=r.hold,l=r.bits,12===r.mode&&(r.back=-1);break}for(r.back=0;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(g&&0==(240&g)){for(v=_,y=g,w=b;g=(C=r.lencode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,r.length=b,0===g){r.mode=26;break}if(32&g){r.back=-1,r.mode=12;break}if(64&g){e.msg="invalid literal/length code",r.mode=30;break}r.extra=15&g,r.mode=22;case 22:if(r.extra){for(z=r.extra;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.length+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}r.was=r.length,r.mode=23;case 23:for(;g=(C=r.distcode[u&(1<<r.distbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(0==(240&g)){for(v=_,y=g,w=b;g=(C=r.distcode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,64&g){e.msg="invalid distance code",r.mode=30;break}r.offset=b,r.extra=15&g,r.mode=24;case 24:if(r.extra){for(z=r.extra;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.offset+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}if(r.offset>r.dmax){e.msg="invalid distance too far back",r.mode=30;break}r.mode=25;case 25:if(0===h)break e;if(d=c-h,r.offset>d){if((d=r.offset-d)>r.whave&&r.sane){e.msg="invalid distance too far back",r.mode=30;break}p=d>r.wnext?(d-=r.wnext,r.wsize-d):r.wnext-d,d>r.length&&(d=r.length),m=r.window}else m=i,p=a-r.offset,d=r.length;for(h<d&&(d=h),h-=d,r.length-=d;i[a++]=m[p++],--d;);0===r.length&&(r.mode=21);break;case 26:if(0===h)break e;i[a++]=r.length,h--,r.mode=21;break;case 27:if(r.wrap){for(;l<32;){if(0===o)break e;o--,u|=n[s++]<<l,l+=8}if(c-=h,e.total_out+=c,r.total+=c,c&&(e.adler=r.check=r.flags?B(r.check,i,c,a-c):O(r.check,i,c,a-c)),c=h,(r.flags?u:L(u))!==r.check){e.msg="incorrect data check",r.mode=30;break}l=u=0}r.mode=28;case 28:if(r.wrap&&r.flags){for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u!==(4294967295&r.total)){e.msg="incorrect length check",r.mode=30;break}l=u=0}r.mode=29;case 29:x=1;break e;case 30:x=-3;break e;case 31:return-4;case 32:default:return U}return e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,(r.wsize||c!==e.avail_out&&r.mode<30&&(r.mode<27||4!==t))&&Z(e,e.output,e.next_out,c-e.avail_out)?(r.mode=31,-4):(f-=e.avail_in,c-=e.avail_out,e.total_in+=f,e.total_out+=c,r.total+=c,r.wrap&&c&&(e.adler=r.check=r.flags?B(r.check,i,c,e.next_out-c):O(r.check,i,c,e.next_out-c)),e.data_type=r.bits+(r.last?64:0)+(12===r.mode?128:0)+(20===r.mode||15===r.mode?256:0),(0==f&&0===c||4===t)&&x===N&&(x=-5),x)},r.inflateEnd=function(e){if(!e||!e.state)return U;var t=e.state;return t.window&&(t.window=null),e.state=null,N},r.inflateGetHeader=function(e,t){var r;return e&&e.state?0==(2&(r=e.state).wrap)?U:((r.head=t).done=!1,N):U},r.inflateSetDictionary=function(e,t){var r,n=t.length;return e&&e.state?0!==(r=e.state).wrap&&11!==r.mode?U:11===r.mode&&O(1,t,n,0)!==r.check?-3:Z(e,t,n,n)?(r.mode=31,-4):(r.havedict=1,N):U},r.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(e,t,r){"use strict";var D=e("../utils/common"),F=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],N=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],U=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],P=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];t.exports=function(e,t,r,n,i,s,a,o){var h,u,l,f,c,d,p,m,_,g=o.bits,b=0,v=0,y=0,w=0,k=0,x=0,S=0,z=0,C=0,E=0,A=null,I=0,O=new D.Buf16(16),B=new D.Buf16(16),R=null,T=0;for(b=0;b<=15;b++)O[b]=0;for(v=0;v<n;v++)O[t[r+v]]++;for(k=g,w=15;1<=w&&0===O[w];w--);if(w<k&&(k=w),0===w)return i[s++]=20971520,i[s++]=20971520,o.bits=1,0;for(y=1;y<w&&0===O[y];y++);for(k<y&&(k=y),b=z=1;b<=15;b++)if(z<<=1,(z-=O[b])<0)return-1;if(0<z&&(0===e||1!==w))return-1;for(B[1]=0,b=1;b<15;b++)B[b+1]=B[b]+O[b];for(v=0;v<n;v++)0!==t[r+v]&&(a[B[t[r+v]]++]=v);if(d=0===e?(A=R=a,19):1===e?(A=F,I-=257,R=N,T-=257,256):(A=U,R=P,-1),b=y,c=s,S=v=E=0,l=-1,f=(C=1<<(x=k))-1,1===e&&852<C||2===e&&592<C)return 1;for(;;){for(p=b-S,_=a[v]<d?(m=0,a[v]):a[v]>d?(m=R[T+a[v]],A[I+a[v]]):(m=96,0),h=1<<b-S,y=u=1<<x;i[c+(E>>S)+(u-=h)]=p<<24|m<<16|_|0,0!==u;);for(h=1<<b-1;E&h;)h>>=1;if(0!==h?(E&=h-1,E+=h):E=0,v++,0==--O[b]){if(b===w)break;b=t[r+a[v]]}if(k<b&&(E&f)!==l){for(0===S&&(S=k),c+=y,z=1<<(x=b-S);x+S<w&&!((z-=O[x+S])<=0);)x++,z<<=1;if(C+=1<<x,1===e&&852<C||2===e&&592<C)return 1;i[l=E&f]=k<<24|x<<16|c-s|0}}return 0!==E&&(i[c+E]=b-S<<24|64<<16|0),o.bits=k,0}},{"../utils/common":41}],51:[function(e,t,r){"use strict";t.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],52:[function(e,t,r){"use strict";var i=e("../utils/common"),o=0,h=1;function n(e){for(var t=e.length;0<=--t;)e[t]=0}var s=0,a=29,u=256,l=u+1+a,f=30,c=19,_=2*l+1,g=15,d=16,p=7,m=256,b=16,v=17,y=18,w=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],k=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],x=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],S=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],z=new Array(2*(l+2));n(z);var C=new Array(2*f);n(C);var E=new Array(512);n(E);var A=new Array(256);n(A);var I=new Array(a);n(I);var O,B,R,T=new Array(f);function D(e,t,r,n,i){this.static_tree=e,this.extra_bits=t,this.extra_base=r,this.elems=n,this.max_length=i,this.has_stree=e&&e.length}function F(e,t){this.dyn_tree=e,this.max_code=0,this.stat_desc=t}function N(e){return e<256?E[e]:E[256+(e>>>7)]}function U(e,t){e.pending_buf[e.pending++]=255&t,e.pending_buf[e.pending++]=t>>>8&255}function P(e,t,r){e.bi_valid>d-r?(e.bi_buf|=t<<e.bi_valid&65535,U(e,e.bi_buf),e.bi_buf=t>>d-e.bi_valid,e.bi_valid+=r-d):(e.bi_buf|=t<<e.bi_valid&65535,e.bi_valid+=r)}function L(e,t,r){P(e,r[2*t],r[2*t+1])}function j(e,t){for(var r=0;r|=1&e,e>>>=1,r<<=1,0<--t;);return r>>>1}function Z(e,t,r){var n,i,s=new Array(g+1),a=0;for(n=1;n<=g;n++)s[n]=a=a+r[n-1]<<1;for(i=0;i<=t;i++){var o=e[2*i+1];0!==o&&(e[2*i]=j(s[o]++,o))}}function W(e){var t;for(t=0;t<l;t++)e.dyn_ltree[2*t]=0;for(t=0;t<f;t++)e.dyn_dtree[2*t]=0;for(t=0;t<c;t++)e.bl_tree[2*t]=0;e.dyn_ltree[2*m]=1,e.opt_len=e.static_len=0,e.last_lit=e.matches=0}function M(e){8<e.bi_valid?U(e,e.bi_buf):0<e.bi_valid&&(e.pending_buf[e.pending++]=e.bi_buf),e.bi_buf=0,e.bi_valid=0}function H(e,t,r,n){var i=2*t,s=2*r;return e[i]<e[s]||e[i]===e[s]&&n[t]<=n[r]}function G(e,t,r){for(var n=e.heap[r],i=r<<1;i<=e.heap_len&&(i<e.heap_len&&H(t,e.heap[i+1],e.heap[i],e.depth)&&i++,!H(t,n,e.heap[i],e.depth));)e.heap[r]=e.heap[i],r=i,i<<=1;e.heap[r]=n}function K(e,t,r){var n,i,s,a,o=0;if(0!==e.last_lit)for(;n=e.pending_buf[e.d_buf+2*o]<<8|e.pending_buf[e.d_buf+2*o+1],i=e.pending_buf[e.l_buf+o],o++,0===n?L(e,i,t):(L(e,(s=A[i])+u+1,t),0!==(a=w[s])&&P(e,i-=I[s],a),L(e,s=N(--n),r),0!==(a=k[s])&&P(e,n-=T[s],a)),o<e.last_lit;);L(e,m,t)}function Y(e,t){var r,n,i,s=t.dyn_tree,a=t.stat_desc.static_tree,o=t.stat_desc.has_stree,h=t.stat_desc.elems,u=-1;for(e.heap_len=0,e.heap_max=_,r=0;r<h;r++)0!==s[2*r]?(e.heap[++e.heap_len]=u=r,e.depth[r]=0):s[2*r+1]=0;for(;e.heap_len<2;)s[2*(i=e.heap[++e.heap_len]=u<2?++u:0)]=1,e.depth[i]=0,e.opt_len--,o&&(e.static_len-=a[2*i+1]);for(t.max_code=u,r=e.heap_len>>1;1<=r;r--)G(e,s,r);for(i=h;r=e.heap[1],e.heap[1]=e.heap[e.heap_len--],G(e,s,1),n=e.heap[1],e.heap[--e.heap_max]=r,e.heap[--e.heap_max]=n,s[2*i]=s[2*r]+s[2*n],e.depth[i]=(e.depth[r]>=e.depth[n]?e.depth[r]:e.depth[n])+1,s[2*r+1]=s[2*n+1]=i,e.heap[1]=i++,G(e,s,1),2<=e.heap_len;);e.heap[--e.heap_max]=e.heap[1],function(e,t){var r,n,i,s,a,o,h=t.dyn_tree,u=t.max_code,l=t.stat_desc.static_tree,f=t.stat_desc.has_stree,c=t.stat_desc.extra_bits,d=t.stat_desc.extra_base,p=t.stat_desc.max_length,m=0;for(s=0;s<=g;s++)e.bl_count[s]=0;for(h[2*e.heap[e.heap_max]+1]=0,r=e.heap_max+1;r<_;r++)p<(s=h[2*h[2*(n=e.heap[r])+1]+1]+1)&&(s=p,m++),h[2*n+1]=s,u<n||(e.bl_count[s]++,a=0,d<=n&&(a=c[n-d]),o=h[2*n],e.opt_len+=o*(s+a),f&&(e.static_len+=o*(l[2*n+1]+a)));if(0!==m){do{for(s=p-1;0===e.bl_count[s];)s--;e.bl_count[s]--,e.bl_count[s+1]+=2,e.bl_count[p]--,m-=2}while(0<m);for(s=p;0!==s;s--)for(n=e.bl_count[s];0!==n;)u<(i=e.heap[--r])||(h[2*i+1]!==s&&(e.opt_len+=(s-h[2*i+1])*h[2*i],h[2*i+1]=s),n--)}}(e,t),Z(s,u,e.bl_count)}function X(e,t,r){var n,i,s=-1,a=t[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),t[2*(r+1)+1]=65535,n=0;n<=r;n++)i=a,a=t[2*(n+1)+1],++o<h&&i===a||(o<u?e.bl_tree[2*i]+=o:0!==i?(i!==s&&e.bl_tree[2*i]++,e.bl_tree[2*b]++):o<=10?e.bl_tree[2*v]++:e.bl_tree[2*y]++,s=i,u=(o=0)===a?(h=138,3):i===a?(h=6,3):(h=7,4))}function V(e,t,r){var n,i,s=-1,a=t[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),n=0;n<=r;n++)if(i=a,a=t[2*(n+1)+1],!(++o<h&&i===a)){if(o<u)for(;L(e,i,e.bl_tree),0!=--o;);else 0!==i?(i!==s&&(L(e,i,e.bl_tree),o--),L(e,b,e.bl_tree),P(e,o-3,2)):o<=10?(L(e,v,e.bl_tree),P(e,o-3,3)):(L(e,y,e.bl_tree),P(e,o-11,7));s=i,u=(o=0)===a?(h=138,3):i===a?(h=6,3):(h=7,4)}}n(T);var q=!1;function J(e,t,r,n){P(e,(s<<1)+(n?1:0),3),function(e,t,r,n){M(e),n&&(U(e,r),U(e,~r)),i.arraySet(e.pending_buf,e.window,t,r,e.pending),e.pending+=r}(e,t,r,!0)}r._tr_init=function(e){q||(function(){var e,t,r,n,i,s=new Array(g+1);for(n=r=0;n<a-1;n++)for(I[n]=r,e=0;e<1<<w[n];e++)A[r++]=n;for(A[r-1]=n,n=i=0;n<16;n++)for(T[n]=i,e=0;e<1<<k[n];e++)E[i++]=n;for(i>>=7;n<f;n++)for(T[n]=i<<7,e=0;e<1<<k[n]-7;e++)E[256+i++]=n;for(t=0;t<=g;t++)s[t]=0;for(e=0;e<=143;)z[2*e+1]=8,e++,s[8]++;for(;e<=255;)z[2*e+1]=9,e++,s[9]++;for(;e<=279;)z[2*e+1]=7,e++,s[7]++;for(;e<=287;)z[2*e+1]=8,e++,s[8]++;for(Z(z,l+1,s),e=0;e<f;e++)C[2*e+1]=5,C[2*e]=j(e,5);O=new D(z,w,u+1,l,g),B=new D(C,k,0,f,g),R=new D(new Array(0),x,0,c,p)}(),q=!0),e.l_desc=new F(e.dyn_ltree,O),e.d_desc=new F(e.dyn_dtree,B),e.bl_desc=new F(e.bl_tree,R),e.bi_buf=0,e.bi_valid=0,W(e)},r._tr_stored_block=J,r._tr_flush_block=function(e,t,r,n){var i,s,a=0;0<e.level?(2===e.strm.data_type&&(e.strm.data_type=function(e){var t,r=4093624447;for(t=0;t<=31;t++,r>>>=1)if(1&r&&0!==e.dyn_ltree[2*t])return o;if(0!==e.dyn_ltree[18]||0!==e.dyn_ltree[20]||0!==e.dyn_ltree[26])return h;for(t=32;t<u;t++)if(0!==e.dyn_ltree[2*t])return h;return o}(e)),Y(e,e.l_desc),Y(e,e.d_desc),a=function(e){var t;for(X(e,e.dyn_ltree,e.l_desc.max_code),X(e,e.dyn_dtree,e.d_desc.max_code),Y(e,e.bl_desc),t=c-1;3<=t&&0===e.bl_tree[2*S[t]+1];t--);return e.opt_len+=3*(t+1)+5+5+4,t}(e),i=e.opt_len+3+7>>>3,(s=e.static_len+3+7>>>3)<=i&&(i=s)):i=s=r+5,r+4<=i&&-1!==t?J(e,t,r,n):4===e.strategy||s===i?(P(e,2+(n?1:0),3),K(e,z,C)):(P(e,4+(n?1:0),3),function(e,t,r,n){var i;for(P(e,t-257,5),P(e,r-1,5),P(e,n-4,4),i=0;i<n;i++)P(e,e.bl_tree[2*S[i]+1],3);V(e,e.dyn_ltree,t-1),V(e,e.dyn_dtree,r-1)}(e,e.l_desc.max_code+1,e.d_desc.max_code+1,a+1),K(e,e.dyn_ltree,e.dyn_dtree)),W(e),n&&M(e)},r._tr_tally=function(e,t,r){return e.pending_buf[e.d_buf+2*e.last_lit]=t>>>8&255,e.pending_buf[e.d_buf+2*e.last_lit+1]=255&t,e.pending_buf[e.l_buf+e.last_lit]=255&r,e.last_lit++,0===t?e.dyn_ltree[2*r]++:(e.matches++,t--,e.dyn_ltree[2*(A[r]+u+1)]++,e.dyn_dtree[2*N(t)]++),e.last_lit===e.lit_bufsize-1},r._tr_align=function(e){P(e,2,3),L(e,m,z),function(e){16===e.bi_valid?(U(e,e.bi_buf),e.bi_buf=0,e.bi_valid=0):8<=e.bi_valid&&(e.pending_buf[e.pending++]=255&e.bi_buf,e.bi_buf>>=8,e.bi_valid-=8)}(e)}},{"../utils/common":41}],53:[function(e,t,r){"use strict";t.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(e,t,r){(function(e){!function(r,n){"use strict";if(!r.setImmediate){var i,s,t,a,o=1,h={},u=!1,l=r.document,e=Object.getPrototypeOf&&Object.getPrototypeOf(r);e=e&&e.setTimeout?e:r,i="[object process]"==={}.toString.call(r.process)?function(e){process.nextTick(function(){c(e)})}:function(){if(r.postMessage&&!r.importScripts){var e=!0,t=r.onmessage;return r.onmessage=function(){e=!1},r.postMessage("","*"),r.onmessage=t,e}}()?(a="setImmediate$"+Math.random()+"$",r.addEventListener?r.addEventListener("message",d,!1):r.attachEvent("onmessage",d),function(e){r.postMessage(a+e,"*")}):r.MessageChannel?((t=new MessageChannel).port1.onmessage=function(e){c(e.data)},function(e){t.port2.postMessage(e)}):l&&"onreadystatechange"in l.createElement("script")?(s=l.documentElement,function(e){var t=l.createElement("script");t.onreadystatechange=function(){c(e),t.onreadystatechange=null,s.removeChild(t),t=null},s.appendChild(t)}):function(e){setTimeout(c,0,e)},e.setImmediate=function(e){"function"!=typeof e&&(e=new Function(""+e));for(var t=new Array(arguments.length-1),r=0;r<t.length;r++)t[r]=arguments[r+1];var n={callback:e,args:t};return h[o]=n,i(o),o++},e.clearImmediate=f}function f(e){delete h[e]}function c(e){if(u)setTimeout(c,0,e);else{var t=h[e];if(t){u=!0;try{!function(e){var t=e.callback,r=e.args;switch(r.length){case 0:t();break;case 1:t(r[0]);break;case 2:t(r[0],r[1]);break;case 3:t(r[0],r[1],r[2]);break;default:t.apply(n,r)}}(t)}finally{f(e),u=!1}}}}function d(e){e.source===r&&"string"==typeof e.data&&0===e.data.indexOf(a)&&c(+e.data.slice(a.length))}}("undefined"==typeof self?void 0===e?this:e:self)}).call(this,"undefined"!=typeof __webpack_require__.g?__webpack_require__.g:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[10])(10)});

/***/ }),

/***/ "./src/DebugMenu.ts":
/*!**************************!*\
  !*** ./src/DebugMenu.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DebugMenu: () => (/* binding */ DebugMenu)
/* harmony export */ });
/**
 * Our class for debug screen
 * Note: using this slows down performance. To disable set the attribute debugMode to false.
 */
var DebugMenu = /** @class */ (function () {
    /**
     * Constructs debug menu
     * @param mode (optional) Boolean if debug mode is on or off - default to true
     */
    function DebugMenu(mode) {
        if (mode === void 0) { mode = true; }
        this._debugMode = true;
        this.object = document.getElementById("debugMenu");
        this.objects = {};
        this.debugMode = mode;
        this.lastUpdate = 0;
        this.updateSpeed = 10;
    }
    /**
     * Updates value in debug menu
     */
    DebugMenu.prototype.update = function () {
        if (this.debugMode) {
            if (Date.now() - this.lastUpdate >= 1000 / this.updateSpeed) {
                this.object.innerHTML = "";
                for (var key in this.objects) {
                    var val = this.objects[key];
                    var a = val();
                    var elem = document.createElement("p");
                    elem.textContent = "".concat(key, ": ").concat(a);
                    this.object.appendChild(elem);
                }
                this.lastUpdate = Date.now();
            }
        }
    };
    /**
     * Adds thing to be debug
     * @param key The id/identifier on screen
     * @param supplier Has to be the SUPPLIER to the object you now want to read. If you want it to always show the variable counter, then you would use the ARROW FUNCTION ()=>`${counter}` in this area. Note that the arrow function must always return a number or string
     */
    DebugMenu.prototype.addElement = function (key, supplier) {
        this.objects[key] = supplier;
    };
    /**
     * Remove element from debug menu
     * @param key Key to remove (string)
     */
    DebugMenu.prototype.removeElement = function (key) {
        delete this.objects[key];
    };
    Object.defineProperty(DebugMenu.prototype, "debugMode", {
        get: function () {
            return this._debugMode;
        },
        set: function (mode) {
            this._debugMode = mode;
            if (mode == true) {
                this.object.style.display = "block";
            }
            else {
                this.object.style.display = "none";
            }
        },
        enumerable: false,
        configurable: true
    });
    return DebugMenu;
}());



/***/ }),

/***/ "./src/GameEngine.ts":
/*!***************************!*\
  !*** ./src/GameEngine.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GameEngine: () => (/* binding */ GameEngine)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var _DebugMenu__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DebugMenu */ "./src/DebugMenu.ts");
/* harmony import */ var _map_Map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./map/Map */ "./src/map/Map.ts");
/* harmony import */ var _render_Camera__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./render/Camera */ "./src/render/Camera.ts");
/* harmony import */ var _render_GLRenderer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./render/GLRenderer */ "./src/render/GLRenderer.ts");
/* harmony import */ var _Pathtracing_PathTracer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Pathtracing/PathTracer */ "./src/Pathtracing/PathTracer.ts");
/* harmony import */ var _render_GlUtils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./render/GlUtils */ "./src/render/GlUtils.ts");
/* harmony import */ var _models_stand_3mf__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../models/stand.3mf */ "./models/stand.3mf");
/* harmony import */ var _modelLoader_3fmreader__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./modelLoader/3fmreader */ "./src/modelLoader/3fmreader.ts");
/* harmony import */ var _map_terrains__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./map/terrains */ "./src/map/terrains.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};










/**
 * Our holding class for all game mechanics
 * Generally doing something like this is better programming practice & may avoid bugs and merge conflicts in the future
 */
var GameEngine = /** @class */ (function () {
    /**
     * Constructs game engine
     * @param canvasId The ID of the canvas rendered to
     * @returns
     */
    function GameEngine(canvasId) {
        var _this = this;
        //
        this.keys = {};
        this.maxFPS = 60;
        this.frameInterval = 1000 / this.maxFPS;
        this.lastRenderTime = 0;
        this.mode = 0; // 0 for hybrid, 1 for pathtracer
        //
        this.frameCounter = 0;
        this.lastFPSCheck = 0;
        this.currentFPS = 0;
        this.worldInitialized = false;
        //Debugger
        this.debug = new _DebugMenu__WEBPACK_IMPORTED_MODULE_0__.DebugMenu(true); // Pass into class when want to use
        this.canvas = document.getElementById(canvasId);
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.display = "none";
        //GL Context
        this.gl = this.canvas.getContext("webgl2", { antialias: true });
        //Initialize controls
        this.addKeys();
        this.updatePathracing = function () { };
        //Initialize world
        this.world = new _map_Map__WEBPACK_IMPORTED_MODULE_1__.WorldMap(1000, 64, 1000, this.gl, function () { return _this.updatePathracing; });
        //Initialize Camera
        this.mainCamera = new _render_Camera__WEBPACK_IMPORTED_MODULE_2__.Camera(gl_matrix__WEBPACK_IMPORTED_MODULE_9__.fromValues(0, 0, 3));
        //Initialize Renderer
        this.renderer = new _render_GLRenderer__WEBPACK_IMPORTED_MODULE_3__.GLRenderer(this.gl, this.canvas, this.mainCamera, this.debug, this.world);
        //Initial pathTracer
        this.pathTracer = new _Pathtracing_PathTracer__WEBPACK_IMPORTED_MODULE_4__.PathTracer(this.canvas, this.gl, this.world, this.mainCamera, this.debug);
        this.updatePathracing = function () {
            _this.pathTracer.initBVH(_this.world.combinedMesh());
            _this.pathTracer.init(false);
        };
        //Events
        this.canvas.addEventListener("mousedown", function () { return _this.requestScreenLock(); });
        this.canvas.addEventListener("mousemove", function (e) {
            return _this.mouseMove(e);
        });
        window.addEventListener("resize", function () { return _this.resizeCanvas(); });
        //Debugging
        this.debug.addElement("FPS", function () { return Math.round(_this.currentFPS); });
        this.debug.addElement("#Types", function () { return Object.keys(_map_terrains__WEBPACK_IMPORTED_MODULE_8__.Terrains).length; });
        //Initialize switcher
        var rayBtn = document.getElementById("raytracing");
        var pathBtn = document.getElementById("pathtracing");
        rayBtn.addEventListener("click", function () {
            rayBtn.classList.add("active");
            pathBtn.classList.remove("active");
            if (_this.mode == 1) {
                _this.pathTracer.leave();
            }
            _this.mode = 0; // Set to raytracing
        });
        pathBtn.addEventListener("click", function () {
            pathBtn.classList.add("active");
            rayBtn.classList.remove("active");
            _this.mode = 1; // Set to pathtracing
            _this.pathTracer.init();
        });
        //Initialize menu
        var menuButton = document.getElementById("menu-toggle");
        var sidebar = document.getElementById("sidebar");
        var topBar = document.getElementById("topBarWrapper");
        menuButton.addEventListener("click", function () {
            sidebar.classList.toggle("open");
            topBar.classList.toggle("shifted");
        });
        //Check to see if WebGL working
        if (!this.gl) {
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
            return;
        }
        this.initialize();
    }
    GameEngine.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var mesh, identity2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(this.world.chunks.map(function (chunk) { return chunk.generateTerrain(); }))];
                    case 1:
                        _a.sent();
                        this.world.populateFieldMap();
                        return [4 /*yield*/, Promise.all(this.world.chunks.map(function (chunk) { return chunk.generateMarchingCubes(); }))];
                    case 2:
                        _a.sent();
                        this.renderer.GenerateTriangleBuffer(_render_GlUtils__WEBPACK_IMPORTED_MODULE_5__.GlUtils.genTerrainVertices(this.world));
                        return [4 /*yield*/, (0,_modelLoader_3fmreader__WEBPACK_IMPORTED_MODULE_7__.threemfToMesh)(_models_stand_3mf__WEBPACK_IMPORTED_MODULE_6__)];
                    case 3:
                        mesh = _a.sent();
                        identity2 = gl_matrix__WEBPACK_IMPORTED_MODULE_10__.create();
                        gl_matrix__WEBPACK_IMPORTED_MODULE_10__.identity(identity2);
                        this.world.addObject(mesh, identity2, "Gear");
                        console.log(_map_terrains__WEBPACK_IMPORTED_MODULE_8__.Terrains);
                        this.pathTracer.initBVH(this.world.combinedMesh());
                        this.pathTracer.init(false);
                        this.worldInitialized = true;
                        this.canvas.style.display = "block";
                        document.getElementById("loadingBox").style.display = "none";
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Our Game Loop - Run once every frame (capped at max framerate)
     */
    GameEngine.prototype.tick = function (timestamp) {
        if (timestamp - this.lastRenderTime < this.frameInterval) {
            return;
        }
        var timePassed = timestamp - this.lastRenderTime;
        this.lastRenderTime = timestamp;
        if (this.worldInitialized) {
            if (GameEngine.getLockedElement()) {
                this.updateCamera(timePassed);
            }
            if (this.mode == 0) {
                this.renderer.render();
            }
            else {
                this.pathTracer.render(timestamp);
            }
        }
        this.frameCounter += 1;
        if (Date.now() - this.lastFPSCheck >= 1000) {
            this.currentFPS =
                this.frameCounter / ((Date.now() - this.lastFPSCheck) / 1000);
            this.lastFPSCheck = Date.now();
            this.frameCounter = 0;
        }
        this.debug.update();
    };
    /**
     * Controls to move the camera!
     */
    GameEngine.prototype.updateCamera = function (time) {
        var velocity = this.mainCamera.speed * time;
        var movement = gl_matrix__WEBPACK_IMPORTED_MODULE_9__.create();
        var oldCamPos = gl_matrix__WEBPACK_IMPORTED_MODULE_9__.create();
        gl_matrix__WEBPACK_IMPORTED_MODULE_9__.copy(oldCamPos, this.mainCamera.position);
        //scaleAndAdd simply adds the second operand by a scaler. Basically just +=camera.front*velocity
        if (this.keys["KeyW"])
            gl_matrix__WEBPACK_IMPORTED_MODULE_9__.scaleAndAdd(movement, movement, this.mainCamera.front, velocity); // Forward
        if (this.keys["KeyS"])
            gl_matrix__WEBPACK_IMPORTED_MODULE_9__.scaleAndAdd(movement, movement, this.mainCamera.front, -velocity); // Backward
        if (this.keys["KeyA"])
            gl_matrix__WEBPACK_IMPORTED_MODULE_9__.scaleAndAdd(movement, movement, this.mainCamera.right, -velocity); // Left
        if (this.keys["KeyD"])
            gl_matrix__WEBPACK_IMPORTED_MODULE_9__.scaleAndAdd(movement, movement, this.mainCamera.right, velocity); // Right
        if (this.keys["Space"])
            gl_matrix__WEBPACK_IMPORTED_MODULE_9__.scaleAndAdd(movement, movement, this.mainCamera.up, velocity); // Up
        if (this.keys["ShiftLeft"])
            gl_matrix__WEBPACK_IMPORTED_MODULE_9__.scaleAndAdd(movement, movement, this.mainCamera.up, -velocity); // Down
        gl_matrix__WEBPACK_IMPORTED_MODULE_9__.add(this.mainCamera.position, this.mainCamera.position, movement);
        if (!gl_matrix__WEBPACK_IMPORTED_MODULE_9__.equals(this.mainCamera.position, oldCamPos)) {
            this.pathTracer.resetAccumulation();
        }
    };
    GameEngine.prototype.addKeys = function () {
        var _this = this;
        window.addEventListener("keydown", function (event) {
            _this.keys[event.code] = true;
        });
        window.addEventListener("keyup", function (event) {
            _this.keys[event.code] = false;
        });
    };
    /*--------------------------------Utilities--------------------------------*/
    /**
     * Requests a pointer lock on the game
     */
    GameEngine.prototype.requestScreenLock = function () {
        this.canvas.requestPointerLock();
        document.getElementById("body").requestFullscreen();
    };
    /**
     * To measure the movement of the mouse
     */
    GameEngine.prototype.mouseMove = function (event) {
        if (GameEngine.getLockedElement()) {
            var movementX = event.movementX, movementY = event.movementY;
            // Convert pixels to angles
            this.mainCamera.yaw += movementX * this.mainCamera.sensitivity;
            this.mainCamera.pitch -= movementY * this.mainCamera.sensitivity;
            // Constrain pitch (to prevent flipping)
            if (this.mainCamera.pitch > 89)
                this.mainCamera.pitch = 89;
            if (this.mainCamera.pitch < -89)
                this.mainCamera.pitch = -89;
            this.mainCamera.UpdateCameraVectors();
            this.pathTracer.resetAccumulation();
        }
    };
    /**
     * Resize the canvas to fill screen at all times
     */
    GameEngine.prototype.resizeCanvas = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.pathTracer.resetAccumulation();
    };
    /**
     * Use when you want to see if the screen is locked or not
     * @returns HTML Element (The locked element)
     */
    GameEngine.getLockedElement = function () {
        return document.pointerLockElement;
    };
    GameEngine.toRadians = function (degrees) {
        return degrees * (Math.PI / 180);
    };
    return GameEngine;
}());



/***/ }),

/***/ "./src/Pathtracing/PathTracer.ts":
/*!***************************************!*\
  !*** ./src/Pathtracing/PathTracer.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PathTracer: () => (/* binding */ PathTracer)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec2.js");
/* harmony import */ var _map_Mesh__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../map/Mesh */ "./src/map/Mesh.ts");
/* harmony import */ var _render_Shader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../render/Shader */ "./src/render/Shader.ts");
/* harmony import */ var _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../render/GlUtils */ "./src/render/GlUtils.ts");
/* harmony import */ var _glslPath__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./glslPath */ "./src/Pathtracing/glslPath.ts");
/* harmony import */ var _map_BVHUtils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../map/BVHUtils */ "./src/map/BVHUtils.ts");
/* harmony import */ var _copyShader__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./copyShader */ "./src/Pathtracing/copyShader.ts");
// Ik this code is a lot of repeat from code in other places, but I do have some things I plan on doing which would make me using the other code less desirable for this purpose







var PathTracer = /** @class */ (function () {
    function PathTracer(canvas, context, world, camera, debug) {
        // Accumulation stuff
        this.framebuffers = [];
        this.accumulationTextures = [];
        this.currentFrame = 0; // The source texture/framebuffer index
        this.frameNumber = 0; // The accumulation counter
        this.numBounces = 15;
        //Information
        this.vertices = null;
        this.terrains = null;
        this.boundingBoxes = null;
        // BVH
        this.nodes = null;
        this.leafs = null;
        // Terrain Info
        this.terrainTypes = null;
        this.vertexNormals = null;
        this.canvas = canvas;
        this.gl = context;
        this.world = world;
        this.camera = camera;
        this.debug = debug;
        //this.gl.enable(this.gl.BLEND);
        //Enable float texture writing extention
        var float_render_ext = this.gl.getExtension("EXT_color_buffer_float");
        if (!float_render_ext) {
            alert("Error: Floating point render targets are not supported on this browser/GPU.");
            throw new Error("EXT_color_buffer_float not supported");
        }
        //shader
        this.meshShader = new _render_Shader__WEBPACK_IMPORTED_MODULE_1__.Shader(this.gl, _glslPath__WEBPACK_IMPORTED_MODULE_3__.pathTracingVertexShaderCode, _glslPath__WEBPACK_IMPORTED_MODULE_3__.pathTracingFragmentShaderCode);
        this.copyShader = new _render_Shader__WEBPACK_IMPORTED_MODULE_1__.Shader(this.gl, _copyShader__WEBPACK_IMPORTED_MODULE_5__.copyVertexShader, _copyShader__WEBPACK_IMPORTED_MODULE_5__.copyFragmentShader);
        //Slider
        var slider = document.getElementById("bounceSlider");
        slider.addEventListener("input", this.handleBounceInput.bind(this));
        slider.value = this.numBounces.toString();
        var bounceValue = document.getElementById("bounceValue");
        bounceValue.textContent = "".concat(this.numBounces);
    }
    PathTracer.prototype.handleBounceInput = function (event) {
        var target = event.target;
        var newValue = parseInt(target.value);
        this.numBounces = newValue;
        var bounceValue = document.getElementById("bounceValue");
        bounceValue.textContent = newValue.toString();
    };
    PathTracer.prototype.initBVH = function (mainMesh) {
        ////////////////////// build flat BVH structure
        //Obtain bvh from mesh.
        var BVHtriangles = mainMesh.exportBVHTriangles();
        var BVHtree = _map_Mesh__WEBPACK_IMPORTED_MODULE_0__.Mesh.exportBVH(BVHtriangles);
        var flatBVHtree = _map_Mesh__WEBPACK_IMPORTED_MODULE_0__.Mesh.flattenBVH(BVHtree);
        ////////////// Pack everything float format to send to glsl
        //Pack triangles
        var _a = _map_BVHUtils__WEBPACK_IMPORTED_MODULE_4__.BVHUtils.packTriangles(mainMesh.mesh, mainMesh.type, mainMesh.normals), vertices = _a.vertices, terrains = _a.terrains, normals = _a.normals;
        //Pack BVH
        var _b = _map_BVHUtils__WEBPACK_IMPORTED_MODULE_4__.BVHUtils.packBVH(flatBVHtree), boundingBoxes = _b.boundingBoxes, nodes = _b.nodes, leafs = _b.leafs;
        //Pack terrain Types
        var terrainTypes = _map_BVHUtils__WEBPACK_IMPORTED_MODULE_4__.BVHUtils.packTerrainTypes();
        //save
        this.vertices = vertices;
        this.terrains = terrains;
        this.boundingBoxes = boundingBoxes;
        this.nodes = nodes;
        this.leafs = leafs;
        this.terrainTypes = terrainTypes;
        this.vertexNormals = normals;
    };
    PathTracer.prototype.render = function (time) {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Clear the color buffer with specified clear color
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        //const resScaleFactor = 1 / (this.world.resolution / 4);
        this.drawMesh();
    };
    PathTracer.prototype.drawMesh = function () {
        this.initPathtracing();
        //Put camera position, direction in shader
        this.gl.uniform3fv(this.gl.getUniformLocation(this.meshShader.Program, "u_cameraPos"), this.camera.position);
        var viewProjMatrix = this.camera.calculateProjectionMatrix(this.canvas.width, this.canvas.height);
        var invViewProjMatrix = gl_matrix__WEBPACK_IMPORTED_MODULE_6__.create();
        gl_matrix__WEBPACK_IMPORTED_MODULE_6__.invert(invViewProjMatrix, viewProjMatrix);
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.meshShader.Program, "u_invViewProjMatrix"), false, invViewProjMatrix);
        var resolution = gl_matrix__WEBPACK_IMPORTED_MODULE_7__.create();
        resolution[0] = this.canvas.width;
        resolution[1] = this.canvas.height;
        this.gl.uniform2fv(this.gl.getUniformLocation(this.meshShader.Program, "u_resolution"), resolution);
        //put lights in the shader
        _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.updateLights(this.gl, this.meshShader.Program, this.world.lights);
        //Bind Previous Frame
        var lastFrameIndex = this.currentFrame;
        var nextFrameIndex = (this.currentFrame + 1) % 2;
        this.gl.activeTexture(this.gl.TEXTURE8); // Use a new texture unit
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.accumulationTextures[lastFrameIndex]);
        var lastFrameLoc = this.gl.getUniformLocation(this.meshShader.Program, "u_lastFrame");
        this.gl.uniform1i(lastFrameLoc, 8);
        //put samples, bounce in shader
        this.frameNumber++;
        this.gl.uniform1i(this.gl.getUniformLocation(this.meshShader.Program, "numBounces"), this.numBounces);
        this.gl.uniform1f(this.gl.getUniformLocation(this.meshShader.Program, "u_frameNumber"), this.frameNumber); // Send as a float for seeding
        // Draw
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffers[nextFrameIndex]);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
        //Ping Pong
        this.currentFrame = nextFrameIndex;
        //Draw to canvas using copy shader
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.useProgram(this.copyShader.Program);
        _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.bindTex(this.gl, this.copyShader.Program, this.accumulationTextures[nextFrameIndex], "u_sourceTexture", 0);
        var frameLoc = this.gl.getUniformLocation(this.copyShader.Program, "u_frameNumber");
        this.gl.uniform1f(frameLoc, this.frameNumber);
        // We can reuse the same fullscreen triangle VAO
        this.gl.clearColor(0, 0, 0, 1); // Clear the actual screen
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    };
    PathTracer.prototype.makeVao = function () {
        var fullscreenTriangle = new Float32Array([-1, -1, 3, -1, -1, 3]);
        var vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);
        var vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, fullscreenTriangle, this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(0);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
    };
    PathTracer.prototype.init = function (showAccumulation) {
        var _this = this;
        if (showAccumulation === void 0) { showAccumulation = true; }
        if (showAccumulation)
            this.debug.addElement("Accumulation Frame", function () { return _this.frameNumber; });
        this.initPathtracing();
        this.makeVao();
        this.resetAccumulation();
    };
    PathTracer.prototype.leave = function () {
        this.debug.removeElement("Accumulation Frame");
    };
    PathTracer.prototype.initPathtracing = function () {
        this.gl.useProgram(this.meshShader.Program);
        //Textures
        var verticeTex = _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.packFloatArrayToTexture(this.gl, this.vertices);
        var terrainTex = _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.packFloatArrayToTexture(this.gl, this.terrains);
        var boundingBoxesTex = _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.packFloatArrayToTexture(this.gl, this.boundingBoxes);
        var nodesTex = _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.packFloatArrayToTexture(this.gl, this.nodes);
        var leafsTex = _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.packFloatArrayToTexture(this.gl, this.leafs);
        var terrainTypeTex = _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.packFloatArrayToTexture(this.gl, this.terrainTypes);
        var vertexNormalsTex = _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.packFloatArrayToTexture(this.gl, this.vertexNormals);
        _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.bindTex(this.gl, this.meshShader.Program, verticeTex, "u_vertices", 0);
        _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.bindTex(this.gl, this.meshShader.Program, terrainTex, "u_terrains", 1);
        _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.bindTex(this.gl, this.meshShader.Program, boundingBoxesTex, "u_boundingBox", 2);
        _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.bindTex(this.gl, this.meshShader.Program, nodesTex, "u_nodesTex", 3);
        _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.bindTex(this.gl, this.meshShader.Program, leafsTex, "u_leafsTex", 4);
        _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.bindTex(this.gl, this.meshShader.Program, terrainTypeTex, "u_terrainTypes", 5);
        _render_GlUtils__WEBPACK_IMPORTED_MODULE_2__.GlUtils.bindTex(this.gl, this.meshShader.Program, vertexNormalsTex, "u_normals", 6);
    };
    PathTracer.prototype.initBuffers = function () {
        this.accumulationTextures = [];
        this.framebuffers = [];
        for (var i = 0; i < 2; ++i) {
            // Create a texture to store the accumulated image
            var texture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, this.canvas.width, this.canvas.height, 0, this.gl.RGBA, this.gl.FLOAT, null);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.accumulationTextures.push(texture);
            // Create a framebuffer and attach the texture to it
            var fbo = this.gl.createFramebuffer();
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
            this.framebuffers.push(fbo);
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null); // Unbind
    };
    PathTracer.prototype.resetAccumulation = function () {
        this.frameNumber = 0;
        this.initBuffers();
    };
    return PathTracer;
}());



/***/ }),

/***/ "./src/Pathtracing/copyShader.ts":
/*!***************************************!*\
  !*** ./src/Pathtracing/copyShader.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   copyFragmentShader: () => (/* binding */ copyFragmentShader),
/* harmony export */   copyVertexShader: () => (/* binding */ copyVertexShader)
/* harmony export */ });
//Imma be honest all this code was written by AI cause I'm too lazy to right the Tone mapping
var copyVertexShader = /* glsl */ "#version 300 es\nprecision highp float;\n\n// Input: A hardcoded triangle that fills the screen\nlayout(location = 0) in vec2 a_position;\n\n// Output: The UV coordinates to sample the texture\nout vec2 v_uv;\n\nvoid main() {\n    // We want the UVs to go from (0,0) to (1,1) across the screen\n    v_uv = a_position * 0.5 + 0.5;\n    \n    // Output the clip-space position of the triangle vertices\n    gl_Position = vec4(a_position, 0.0, 1.0);\n}\n";
var copyFragmentShader = /* glsl */ "#version 300 es\nprecision highp float;\n\nuniform sampler2D u_sourceTexture; // This texture now contains the SUM of samples\nuniform float u_frameNumber;       // We need the frame number here now\nin vec2 v_uv;\nout vec4 fragColor;\n\n// ACES Filmic Tone Mapping Curve\nvec3 ACESFilmic(vec3 x) {\n    const float a = 2.51;\n    const float b = 0.03;\n    const float c = 2.43;\n    const float d = 0.59;\n    const float e = 0.14;\n    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);\n}\n\nvoid main() {\n    // 1. Get the SUM of colors from the accumulation texture\n    vec3 sumColor = texture(u_sourceTexture, v_uv).rgb;\n\n    // 2. Calculate the correct average by dividing by the number of samples (frames)\n    //    Add a max to prevent division by zero if frameNumber is somehow 0.\n    vec3 avgColor = sumColor / max(u_frameNumber, 1.0);\n\n    // 3. Now apply tone mapping and gamma to the STABLE AVERAGE\n    float exposure = 1.0;\n    vec3 tonedColor = ACESFilmic(avgColor * exposure);\n    \n    float gamma = 2.2;\n    vec3 finalColor = pow(tonedColor, vec3(1.0 / gamma));\n\n    fragColor = vec4(finalColor, 1.0);\n}\n";


/***/ }),

/***/ "./src/Pathtracing/glslPath.ts":
/*!*************************************!*\
  !*** ./src/Pathtracing/glslPath.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   pathTracingFragmentShaderCode: () => (/* binding */ pathTracingFragmentShaderCode),
/* harmony export */   pathTracingVertexShaderCode: () => (/* binding */ pathTracingVertexShaderCode)
/* harmony export */ });
var pathTracingVertexShaderCode = /* glsl */ "#version 300 es\nprecision highp float;\n\nlayout(location = 0) in vec2 a_position;\nout vec2 v_uv;\n\nvoid main() {\n    v_uv = a_position * 0.5 + 0.5; // map [-1, 1] \u2192 [0, 1]\n    gl_Position = vec4(a_position, 0.0, 1.0);\n}\n";
var pathTracingFragmentShaderCode = /* glsl */ "#version 300 es\nprecision highp float;\n\n#define MAX_LIGHTS 30\n#define PI 3.1415926\n//#define NUM_TERRAINS 1000 \n\n//Note: \nuniform sampler2D u_lastFrame;\nuniform float u_frameNumber;\nuniform int numBounces;\n\n\nuniform sampler2D u_vertices;\nuniform sampler2D u_terrains;\nuniform sampler2D u_normals;\nuniform sampler2D u_boundingBox;\nuniform sampler2D u_nodesTex;\nuniform sampler2D u_leafsTex;\nuniform sampler2D u_terrainTypes;\nuniform vec3 u_cameraPos;\nuniform mat4 u_invViewProjMatrix;\nuniform vec2 u_resolution;\n\nstruct Light {\n    vec3 position;\n    vec3 color;\n    vec3 showColor;\n    float intensity;\n    float radius;\n};\nuniform Light lights[MAX_LIGHTS];\nuniform int numActiveLights;\n\nin vec2 v_uv;\nout vec4 fragColor;\n\nstruct BVH{\n    vec3 min;\n    vec3 max;\n    int right;\n    int left;\n    int[4] triangles;\n};\n\nstruct Triangle{\n    vec3[3] vertices; \n    int[3] types;\n    vec3 min;\n    vec3 max;\n    vec3 center;\n    vec3 triNormal;\n    vec3[3] normals;\n};\n\nstruct TerrainType{\n    vec3 color;\n    float reflectiveness; // Decimal 0-1   \n    float roughness; // Decimal 0-1\n    int type; //Type. See terrains.ts\n};\n\n//TerrainType[NUM_TERRAINS] Terrains;\n\n// Provides a high quality 32-bit hash function to generate pseudo-random numbers\n// Source: https://www.shadertoy.com/view/4djSRW by Dave Hoskins\nuint hash(uint state) {\n    state ^= 2747636419u;\n    state *= 2654435769u;\n    state ^= state >> 16;\n    state *= 2654435769u;\n    state ^= state >> 16;\n    state *= 2654435769u;\n    return state;\n}\n\n// Generates a random float in the [0, 1] range\nfloat rand(inout uint state) {\n    state = hash(state);\n    return float(state) / 4294967295.0; // 2^32 - 1\n}\n\nfloat fetchFloatFrom1D(sampler2D tex, int index) {\n    ivec2 size = textureSize(tex, 0);\n    int texWidth = size.x;\n    \n    int texelIndex = index / 4;      // Which texel (pixel) contains our float\n    int componentIndex = index % 4;  // Which component (r,g,b,a) of the texel\n\n    // Calculate 2D coordinates of the texel\n    int y_coord = texelIndex / texWidth;\n    int x_coord = texelIndex % texWidth;\n\n    // Convert to UV coordinates [0, 1] for sampling\n    // Add 0.5 to sample the center of the texel\n    float u = (float(x_coord) + 0.5) / float(texWidth);\n    float v = (float(y_coord) + 0.5) / float(size.y);\n\n    vec4 texel = texture(tex, vec2(u, v));\n\n    if (componentIndex == 0) return texel.r;\n    else if (componentIndex == 1) return texel.g;\n    else if (componentIndex == 2) return texel.b;\n    else return texel.a;\n}\n\nBVH getBVH(int i){\n    BVH r;\n    int bbBoxSize = 6;\n    r.min = vec3(fetchFloatFrom1D(u_boundingBox, i*bbBoxSize),fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+1),fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+2));\n    r.max = vec3(fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+3),fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+4),fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+5));\n\n    int nodeSize = 2;\n    r.left = int(fetchFloatFrom1D(u_nodesTex,i*nodeSize));\n    r.right = int(fetchFloatFrom1D(u_nodesTex,i*nodeSize+1));\n\n    int leafSize = 4;\n    r.triangles[0]=int(fetchFloatFrom1D(u_leafsTex,i*leafSize));\n    r.triangles[1]=int(fetchFloatFrom1D(u_leafsTex,i*leafSize+1));\n    r.triangles[2]=int(fetchFloatFrom1D(u_leafsTex,i*leafSize+2));\n    r.triangles[3]=int(fetchFloatFrom1D(u_leafsTex,i*leafSize+3));\n    \n    return r;\n}\n\nTriangle getTriangle(int i){\n    Triangle tri;\n    int triVertexSize = 9;\n    tri.vertices[0] = vec3(fetchFloatFrom1D(u_vertices, i*triVertexSize), fetchFloatFrom1D(u_vertices, i*triVertexSize+1), fetchFloatFrom1D(u_vertices, i*triVertexSize+2));\n    tri.vertices[1] = vec3(fetchFloatFrom1D(u_vertices, i*triVertexSize+3), fetchFloatFrom1D(u_vertices, i*triVertexSize+4), fetchFloatFrom1D(u_vertices, i*triVertexSize+5));\n    tri.vertices[2] = vec3(fetchFloatFrom1D(u_vertices, i*triVertexSize+6), fetchFloatFrom1D(u_vertices, i*triVertexSize+7), fetchFloatFrom1D(u_vertices, i*triVertexSize+8));\n\n    int typeSize = 3;\n    tri.types[0] = int(fetchFloatFrom1D(u_terrains, i*typeSize));\n    tri.types[1] = int(fetchFloatFrom1D(u_terrains, i*typeSize+1));\n    tri.types[2] = int(fetchFloatFrom1D(u_terrains, i*typeSize+2));\n\n    tri.min = vec3(min(tri.vertices[0].x, min(tri.vertices[1].x, tri.vertices[2].x)),\n                   min(tri.vertices[0].y, min(tri.vertices[1].y, tri.vertices[2].y)),\n                   min(tri.vertices[0].z, min(tri.vertices[1].z, tri.vertices[2].z)));\n    tri.max = vec3(max(tri.vertices[0].x, max(tri.vertices[1].x, tri.vertices[2].x)),\n                   max(tri.vertices[0].y, max(tri.vertices[1].y, tri.vertices[2].y)),\n                   max(tri.vertices[0].z, max(tri.vertices[1].z, tri.vertices[2].z)));\n    tri.center = (tri.min + tri.max) * 0.5;\n    tri.triNormal = normalize(cross(tri.vertices[1] - tri.vertices[0], tri.vertices[2] - tri.vertices[0]));\n\n    tri.normals[0] = vec3(fetchFloatFrom1D(u_normals, i*triVertexSize), fetchFloatFrom1D(u_normals, i*triVertexSize+1), fetchFloatFrom1D(u_normals, i*triVertexSize+2));\n    tri.normals[1] = vec3(fetchFloatFrom1D(u_normals, i*triVertexSize+3), fetchFloatFrom1D(u_normals, i*triVertexSize+4), fetchFloatFrom1D(u_normals, i*triVertexSize+5));\n    tri.normals[2] = vec3(fetchFloatFrom1D(u_normals, i*triVertexSize+6), fetchFloatFrom1D(u_normals, i*triVertexSize+7), fetchFloatFrom1D(u_normals, i*triVertexSize+8));\n\n    return tri;\n}\n\nTerrainType getTerrainType(int i){\n    TerrainType t;\n    int terrainTypeSize = 6;\n    t.color = vec3(fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize), fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+1), fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+2));\n    t.reflectiveness = fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+3); \n    t.roughness = fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+4); \n    t.type = int(fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+5));\n\n    return t;\n}\n\nbool intersectAABB(vec3 rayOrigin, vec3 rayDir, vec3 boxMin, vec3 boxMax, out float tMin, out float tMax) {\n    vec3 invDir = 1.0 / rayDir;\n    vec3 t0s = (boxMin - rayOrigin) * invDir;\n    vec3 t1s = (boxMax - rayOrigin) * invDir;\n\n    vec3 tSmalls = min(t0s, t1s);\n    vec3 tBigs = max(t0s, t1s);\n\n    tMin = max(max(tSmalls.x, tSmalls.y), tSmalls.z);\n    tMax = min(min(tBigs.x, tBigs.y), tBigs.z);\n\n    return tMax >= max(tMin, 0.0);\n}\n\n//AI written; Returns distance to intersection with triangle\nfloat intersectTriangle(vec3 rayOrigin, vec3 rayDir, Triangle tri, out vec3 barycentric) {\n    const float EPSILON = 0.000001;\n    vec3 v0 = tri.vertices[0];\n    vec3 v1 = tri.vertices[1];\n    vec3 v2 = tri.vertices[2];\n    vec3 edge1 = v1 - v0;\n    vec3 edge2 = v2 - v0;\n\n    vec3 h = cross(rayDir, edge2);\n    float a = dot(edge1, h);\n\n    if (a > -EPSILON && a < EPSILON) {\n        return -1.0; // Ray is parallel to the triangle\n    }\n\n    float f = 1.0 / a;\n    vec3 s = rayOrigin - v0;\n    float u = f * dot(s, h);\n\n    if (u < 0.0 || u > 1.0) {\n        return -1.0;\n    }\n\n    vec3 q = cross(s, edge1);\n    float v = f * dot(rayDir, q);\n\n    if (v < 0.0 || u + v > 1.0) {\n        return -1.0;\n    }\n\n    // At this stage we can compute t to find out where the intersection point is on the line.\n    float t = f * dot(edge2, q);\n    if (t > EPSILON) { // ray intersection\n        barycentric = vec3(1.0 - u - v, u, v);\n        return t;\n    }\n    \n    return -1.0; // This means that there is a line intersection but not a ray intersection.\n}\n\n//AI written; Returns distance to intersection with light sphere\nfloat intersectLight(vec3 rayOrigin, vec3 rayDir, Light light, out vec3 hitNormal) {\n    vec3 oc = rayOrigin - light.position; \n\n    // The coefficients of the quadratic equation (at^2 + bt + c = 0)\n    float a = dot(rayDir, rayDir); // Should be 1.0 for a normalized rayDir\n    float b = 2.0 * dot(oc, rayDir);\n    float c = dot(oc, oc) - light.radius * light.radius;\n\n    float discriminant = b*b - 4.0*a*c;\n\n    // If the discriminant is negative, the ray misses the sphere.\n    if (discriminant < 0.0) {\n        return -1.0;\n    }\n\n    float sqrt_d = sqrt(discriminant);\n\n    // Calculate the two potential intersection distances (solutions for t)\n    float t0 = (-b - sqrt_d) / (2.0 * a);\n    float t1 = (-b + sqrt_d) / (2.0 * a);\n\n    // We need the smallest, positive t value.\n    // Check the closer intersection point (t0) first.\n    if (t0 > 0.001) { // Use a small epsilon to avoid self-intersection artifacts\n        vec3 hitPoint = rayOrigin + t0 * rayDir;\n        hitNormal = normalize(hitPoint - light.position);\n        return t0;\n    }\n    // If t0 was behind the ray, check the farther intersection point (t1).\n    // This case occurs if the ray starts inside the sphere.\n    else if (t1 > 0.001) {\n        vec3 hitPoint = rayOrigin + t1 * rayDir;\n        hitNormal = normalize(hitPoint - light.position);\n        return t1;\n    }\n\n    // Both intersection points are behind the ray's origin.\n    return -1.0;\n}\n\n/**\n * Returns TRIANGLE index\n */\nint traverseBVH(vec3 rayOrigin, vec3 rayDir, int BVHindex, out vec3 closestBarycentric, out float minHitDistance) {\n    int closestHitIndex = -1;\n    minHitDistance = 1.0/0.0; // Infinity\n\n    int stack[64]; // Stack of 64 - May need to change for larger BVH later\n    int stackPtr = 0;\n    stack[stackPtr++] = 0; // Push root node index\n\n    while (stackPtr > 0) {\n        int nodeIndex = stack[--stackPtr];\n        BVH node = getBVH(nodeIndex);\n\n        float tMin, tMax;\n        if (!intersectAABB(rayOrigin, rayDir, node.min, node.max, tMin, tMax)) {\n            continue;\n        }\n\n        if (tMin >= minHitDistance) {\n            continue;\n        }\n\n        if (node.left == -1) { // Leaf Node\n            for (int j = 0; j < 4; j++) {\n                int triIdx = node.triangles[j];\n                if (triIdx == -1) continue;\n\n                Triangle tri = getTriangle(triIdx);\n                vec3 currentBarycentric;\n                float hitDist = intersectTriangle(rayOrigin, rayDir, tri, currentBarycentric);\n\n                if (hitDist > 0.0 && hitDist < minHitDistance) {\n                    minHitDistance = hitDist;\n                    closestHitIndex = triIdx;\n                    closestBarycentric = currentBarycentric;\n                }\n            }\n        } else { // Internal Node\n            // Check for space for two children to prevent stack overflow\n            if (stackPtr < 63) { \n                stack[stackPtr++] = node.left;\n                stack[stackPtr++] = node.right;\n            }\n        }\n    }\n\n    return closestHitIndex;\n}\n\nvec3 smoothItem(vec3[3] a, vec3 baryCentric){\n    return (\n        baryCentric.x * a[0] + \n        baryCentric.y * a[1] +\n        baryCentric.z * a[2]\n    );\n}\nfloat smoothItem(float[3] a, vec3 baryCentric){\n    return(\n        baryCentric.x * a[0] + \n        baryCentric.y * a[1] +\n        baryCentric.z * a[2]\n    );\n}\n\nvoid getInfo(Triangle tri, TerrainType tt1, TerrainType tt2, TerrainType tt3, vec3 baryCentric, out vec3 smoothNormal, out vec3 matColor, out float matRoughness, out float reflectiveness){\n    vec3[3] colors = vec3[3](\n        tt1.color,\n        tt2.color,\n        tt3.color\n    );\n    float[3] reflectivities = float[3](\n        tt1.reflectiveness,\n        tt2.reflectiveness,\n        tt3.reflectiveness\n    );\n    float[3] roughness = float[3](\n        tt1.roughness,\n        tt2.roughness,\n        tt3.roughness\n    );\n\n    smoothNormal = normalize(smoothItem(tri.normals,baryCentric));\n    matColor = smoothItem(colors,baryCentric);\n    matRoughness = smoothItem(roughness,baryCentric);\n    reflectiveness = smoothItem(reflectivities,baryCentric);\n}\n\n/**\nReturn random direction based on given via cosine\n*/\nvec3 weightedDIR(vec3 normal, inout uint rng_state){\n    float r1 = rand(rng_state);\n    float r2 = rand(rng_state);\n\n    float phi = 2.0 * PI * r1;\n    float cos_theta = sqrt(1.0 - r2);\n    float sin_theta = sqrt(r2);\n    vec3 randomDirHemi = vec3(cos(phi) * sin_theta, sin(phi) * sin_theta, cos_theta);\n    vec3 up = abs(normal.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);\n    vec3 tangent = normalize(cross(up, normal));\n    vec3 bitangent = cross(normal, tangent);\n    vec3 dirWorld = tangent * randomDirHemi.x + bitangent * randomDirHemi.y + normal * randomDirHemi.z;\n    return normalize(dirWorld);\n}\n\nvec3 sampleGlossyDirection(vec3 perfectDir, float roughness, inout uint rng_state) {\n    float r1 = rand(rng_state);\n    float r2 = rand(rng_state);\n\n    float shininess = pow(1.0 - roughness, 3.0) * 1000.0; // adjust as needed\n\n    float phi = 2.0 * PI * r1;\n    float cosTheta = pow(r2, 1.0 / (shininess + 1.0));\n    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);\n\n    vec3 localDir = vec3(\n        cos(phi) * sinTheta,\n        sin(phi) * sinTheta,\n        cosTheta\n    );\n\n    // Construct tangent space around the perfect reflection direction\n    vec3 up = abs(perfectDir.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);\n    vec3 tangent = normalize(cross(up, perfectDir));\n    vec3 bitangent = cross(perfectDir, tangent);\n\n    vec3 worldDir = normalize(\n        tangent * localDir.x + bitangent * localDir.y + perfectDir * localDir.z\n    );\n\n    return worldDir;\n}\n\nbool isValidVec3(vec3 v) {\n    return all(greaterThanEqual(v, vec3(-1e20))) &&\n           all(lessThanEqual(v, vec3(1e20))) &&\n           !any(isnan(v));\n}\n\nvec3 PathTrace(vec3 OGrayOrigin, vec3 OGrayDir, inout uint rng_state) {\n    vec3 rayOrigin = OGrayOrigin;\n    vec3 rayDir = OGrayDir;\n\n    vec3 color = vec3(0.0);\n    vec3 throughput = vec3(1.0);\n\n    int hasMirror = -2;\n    for (int bounce = 0; bounce < numBounces; bounce++) {\n        vec3 baryCentric;\n        float minHitDistance;\n        \n        int triIndex = traverseBVH(rayOrigin, rayDir, 0, baryCentric, minHitDistance);\n        \n        int hitLightIndex = -1;\n        for (int i = 0; i < numActiveLights; i++) {\n            vec3 lightHitNormal;\n            float lightHitDistance = intersectLight(rayOrigin, rayDir, lights[i], lightHitNormal);\n            if (lightHitDistance > 0.0 && lightHitDistance < minHitDistance) {\n                hitLightIndex = i;\n                minHitDistance = lightHitDistance;\n            }\n        }\n\n        if (hitLightIndex != -1) {\n            // Ray hit light source\n            if(bounce != 0){\n                color += throughput * lights[hitLightIndex].color * lights[hitLightIndex].intensity;\n            }else{\n                color = lights[hitLightIndex].showColor;\n            }\n            \n            break; // Path terminates.\n        }\n\n        if (triIndex == -1) {\n            // Ray missed everything and flew into space.\n            if(bounce == 0 || bounce == hasMirror + 1){\n                color = throughput * vec3(0.54,0.824,0.94);\n            }else{\n                color += throughput * 0.00001; // light sky!\n            }\n            break;\n        }\n\n        // The ray hit a triangle \n        //Get information\n        vec3 hitPoint = rayOrigin + rayDir * minHitDistance;\n        Triangle tri = getTriangle(triIndex);\n\n        TerrainType t1 = getTerrainType(tri.types[0]);\n        TerrainType t2 = getTerrainType(tri.types[1]);\n        TerrainType t3 = getTerrainType(tri.types[2]);\n\n        vec3 smoothNormal, matColor;\n        float matRoughness, reflectiveness;\n        int type = 2;\n        type = getTerrainType(tri.types[0]).type;\n        getInfo(tri, t1, t2, t3, baryCentric, smoothNormal, matColor, matRoughness, reflectiveness);\n        \n\n        vec3 geometricNormal = tri.triNormal;\n        bool didSwitch = false;\n        if (dot(geometricNormal, rayDir) > 0.0) geometricNormal = -geometricNormal;\n        if (dot(smoothNormal, geometricNormal) < 0.0) {\n            smoothNormal = -smoothNormal;\n            didSwitch = true;\n        }\n\n        vec3 BRDF = matColor / PI;\n        \n        //in the future consider NEE (Next Event Estimation) - Was removed cause buggy\n\n\n        // INDIRECT LIGHTING (Prepare for the NEXT bounce)\n        // Create the next bounce ray\n        if(type != 4) //Transmission goes through\n            rayOrigin = hitPoint + geometricNormal * 0.01;\n        if(type == 1){ //Diffuse\n            rayDir = weightedDIR(smoothNormal, rng_state);\n            throughput *= matColor;\n        }else if (type == 2) { // Specular (mirror)\n            rayDir = normalize(reflect(rayDir, smoothNormal)); // Use built-in\n            throughput *= vec3(0.8); // decrease brightness a bit\n            hasMirror = bounce;\n        }else if (type == 3){ //Microfacet (Glossy), mixture of diffuse and specular\n            vec3 perfect = normalize(reflect(rayDir, smoothNormal));\n            rayDir = sampleGlossyDirection(perfect, matRoughness, rng_state);\n            throughput *= matColor; //Switch to BDF later\n            //Consider fresnel in the future\n            hasMirror = bounce;\n        }else if (type == 4){ //Transmission (Glass)\n            float eta;\n            vec3 transmissionNormal;\n            if(didSwitch){ //exiting\n                eta = matRoughness / 1.0;\n                transmissionNormal = -smoothNormal; // Refract in the opposite direction\n            }else{ //entering\n                eta = 1.0 / matRoughness;\n                transmissionNormal = smoothNormal; // Refract in the same direction\n            }\n            vec3 refracted = refract(rayDir, transmissionNormal, eta);\n            if (length(refracted) < 0.001) {\n                // TIR: fall back to mirror reflection\n                rayDir = normalize(reflect(rayDir, transmissionNormal));\n                rayOrigin = hitPoint + geometricNormal * 0.01;\n            } else {\n                rayDir = normalize(refracted);\n                rayOrigin = hitPoint + rayDir * 0.01;\n            }\n            hasMirror = bounce; // Transmission is not a mirror, but we still track the last bounce\n            vec3 absorption = (vec3(1.0) - matColor)*0.2;  // if matColor is tint\n            throughput *= exp(-absorption * (minHitDistance*0.2)); //Beer Lambert law\n        }else if (type == 5){ // Emissive\n            color += throughput * matColor;\n            break;\n        }\n    }\n    return min(color, vec3(10.0));\n}\n\nvoid main() {\n    //Random Hash\n    uint pixel_x = uint(v_uv.x * u_resolution.x); \n    uint pixel_y = uint(v_uv.y * u_resolution.y);\n    uint seed = hash(pixel_x) + hash(pixel_y * 1999u);\n    uint rng_state = hash(seed + uint(u_frameNumber));\n    rng_state = hash(rng_state + uint(u_frameNumber));\n\n    //Load terrains\n    /*for(int i = 0; i < NUM_TERRAINS; i++){\n        Terrains[i] = getTerrainType(i);\n    }*/\n    \n    // Jitter calculation for Anti-Alising\n    uint jitter_rng_state = hash(rng_state); // Create a new state from the main one\n    float jitterX = rand(jitter_rng_state) - 0.5; // Random value in [-0.5, 0.5]\n    float jitterY = rand(jitter_rng_state) - 0.5; // Random value in [-0.5, 0.5]\n    vec2 pixelSize = 1.0 / u_resolution; // Get the size of one pixel in UV space [0, 1].\n\n    vec2 jitteredUV = v_uv + vec2(jitterX, jitterY) * pixelSize;\n    vec2 screenPos = jitteredUV * 2.0 - 1.0; // Convert jittered UV to NDC\n\n    // Define the ray in clip space. 'w' is 1.0 because it's a point.\n    vec4 rayClip = vec4(screenPos, -1.0, 1.0); \n    // Transform from clip space to world space\n    vec4 rayWorld = u_invViewProjMatrix * rayClip;\n    // Perform perspective divide\n    rayWorld /= rayWorld.w;\n    // The ray direction is the vector from the camera to this point in the world\n    vec3 rayDir = normalize(rayWorld.xyz - u_cameraPos);\n    vec3 rayOrigin = u_cameraPos;\n\n    vec3 lastSum = texture(u_lastFrame, v_uv).rgb; //Old color\n    vec3 newSampleColor = PathTrace(rayOrigin, rayDir, rng_state); // Sample Color\n    vec3 newSum = lastSum + newSampleColor; // New sum\n\n    fragColor = vec4(newSum,1.0); \n}\n";


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _GameEngine__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./GameEngine */ "./src/GameEngine.ts");
//The idea is YOU SHOULD NEVER EDIT THIS FILE, Edit GameEngine.ts - Abstraction is fun or whatever.

var kMainCanvasId = "#MainCanvas";
var Engine = new _GameEngine__WEBPACK_IMPORTED_MODULE_0__.GameEngine(kMainCanvasId);
var gameTick = function (timestamp) {
    Engine.tick(timestamp);
    requestAnimationFrame(gameTick);
};
requestAnimationFrame(gameTick);


/***/ }),

/***/ "./src/map/BVHUtils.ts":
/*!*****************************!*\
  !*** ./src/map/BVHUtils.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BVHUtils: () => (/* binding */ BVHUtils)
/* harmony export */ });
/* harmony import */ var _terrains__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./terrains */ "./src/map/terrains.ts");

/**
 * Utility class for packing BVH and triangle data into Float32Arrays for GPU processing.
 */
var BVHUtils = /** @class */ (function () {
    function BVHUtils() {
    }
    /**
     * Pack all the triangles into a Float32array(s) which can be passed as a RGBAF32
     * @param tri BVH triangles
     */
    BVHUtils.packTriangles = function (mesh, types, vertexNormals) {
        var floatsPerTexel = 4; //Using rgbaf32 format, each texel (or pixel of texture) can hold up to 4 floats
        //Currently only need to pack the vertices and terrain types - Bounding boxes & other attributes don't matter as they will be part of the BVH
        var vertices = new Float32Array(Math.ceil((mesh.length * 9) / floatsPerTexel) * floatsPerTexel); // Each triangle vertices has 9 attributes (3 vertices, 3 axis)
        var terrains = new Float32Array(Math.ceil((types.length * 3) / floatsPerTexel) * floatsPerTexel); // 3 vertices each have different terrain values.
        var normals = new Float32Array(Math.ceil((mesh.length * 9) / floatsPerTexel) * floatsPerTexel); // Each triangle normal for all the vertices has 9 attributes
        for (var i = 0; i < mesh.length; i++) {
            //Iterate through triangles
            for (var a = 0; a < mesh[i].length; a++) {
                //Iterate through vertices in each triangle
                vertices[i * 9 + 3 * a] = mesh[i][a][0];
                vertices[i * 9 + 3 * a + 1] = mesh[i][a][1];
                vertices[i * 9 + 3 * a + 2] = mesh[i][a][2];
                terrains[i * 3 + a] = types[i][a];
                normals[i * 9 + 3 * a] = vertexNormals[i][a][0];
                normals[i * 9 + 3 * a + 1] = vertexNormals[i][a][1];
                normals[i * 9 + 3 * a + 2] = vertexNormals[i][a][2];
            }
        }
        return { vertices: vertices, terrains: terrains, normals: normals };
    };
    /**
     * Packs flatten BVH to F32 format to be sent to glsl.
     * For how this works @see packTriangles
     * @param BVH
     */
    BVHUtils.packBVH = function (BVH) {
        var floatsPerTexel = 4; //See thing in packTriangles Method
        var boundingBoxes = new Float32Array(Math.ceil((BVH.length * 6) / floatsPerTexel) * floatsPerTexel);
        var nodes = new Float32Array(Math.ceil((BVH.length * 2) / floatsPerTexel) * floatsPerTexel);
        var leafs = new Float32Array(Math.ceil((BVH.length * 4) / floatsPerTexel) * floatsPerTexel);
        for (var i = 0; i < BVH.length; i++) {
            for (var j = 0; j < 3; j++) {
                boundingBoxes[i * 6 + j] = BVH[i].boundingBoxMin[j];
                boundingBoxes[i * 6 + 3 + j] = BVH[i].boundingBoxMax[j];
            }
            nodes[i * 2] = BVH[i].left;
            nodes[i * 2 + 1] = BVH[i].right;
            leafs[i * 4] = BVH[i].t1;
            leafs[i * 4 + 1] = BVH[i].t2;
            leafs[i * 4 + 2] = BVH[i].t3;
            leafs[i * 4 + 3] = BVH[i].t4;
        }
        return {
            boundingBoxes: boundingBoxes,
            nodes: nodes,
            leafs: leafs
        };
    };
    /**
     * Packs terrain type properties into a Float32Array for efficient GPU transfer.
     *
     * Each terrain type's properties (color components, illuminosity, and reflectiveness)
     * are stored sequentially in the output array. The array is padded to ensure its length
     * is a multiple of `floatsPerTexel`.
     *
     * @returns {Float32Array} A packed array containing the terrain types' properties.
     *
     */
    BVHUtils.packTerrainTypes = function () {
        var floatsPerTexel = 4;
        var numberTerrains = Object.keys(_terrains__WEBPACK_IMPORTED_MODULE_0__.Terrains).length;
        var numberFloats = 6;
        var out = new Float32Array(Math.ceil((numberTerrains * numberFloats) / floatsPerTexel) *
            floatsPerTexel); //r,g,b,illuminosity, reflectiveness
        var i = 0;
        for (var key in _terrains__WEBPACK_IMPORTED_MODULE_0__.Terrains) {
            var terrain = _terrains__WEBPACK_IMPORTED_MODULE_0__.Terrains[key];
            out[i * numberFloats] = terrain.color.r / 255;
            out[i * numberFloats + 1] = terrain.color.g / 255;
            out[i * numberFloats + 2] = terrain.color.b / 255;
            out[i * numberFloats + 3] = terrain.reflectiveness;
            out[i * numberFloats + 4] = terrain.roughness;
            out[i * numberFloats + 5] = terrain.type;
            i++;
        }
        return out;
    };
    return BVHUtils;
}());



/***/ }),

/***/ "./src/map/Light.ts":
/*!**************************!*\
  !*** ./src/map/Light.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Light: () => (/* binding */ Light)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");

/**
 *  Represents a light source in the world.
 */
var Light = /** @class */ (function () {
    function Light(position, color, intensity, radius, showColor) {
        this.position = position;
        this.color = color;
        this.intensity = intensity;
        this.radius = radius;
        this.showColor = showColor ? showColor : this.color;
    }
    Light.prototype.setPosition = function (position) {
        this.position = position;
    };
    Light.prototype.addPosition = function (position) {
        gl_matrix__WEBPACK_IMPORTED_MODULE_0__.add(this.position, this.position, position);
    };
    return Light;
}());



/***/ }),

/***/ "./src/map/Map.ts":
/*!************************!*\
  !*** ./src/map/Map.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WorldMap: () => (/* binding */ WorldMap)
/* harmony export */ });
/* harmony import */ var _marching_cubes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./marching_cubes */ "./src/map/marching_cubes.ts");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec2.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec4.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var _Light__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Light */ "./src/map/Light.ts");
/* harmony import */ var _terrains__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./terrains */ "./src/map/terrains.ts");
/* harmony import */ var _Mesh__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Mesh */ "./src/map/Mesh.ts");
/* harmony import */ var _render_GlUtils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../render/GlUtils */ "./src/render/GlUtils.ts");
/* harmony import */ var _cubes_utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./cubes_utils */ "./src/map/cubes_utils.ts");
/* harmony import */ var _ObjectUI__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./ObjectUI */ "./src/map/ObjectUI.ts");
//Wrapper classes (will write stuff later)








/**
 * The object holding the map of the world
 * Center chunk starts at 0,0 (probably)
 */
var WorldMap = /** @class */ (function () {
    /**
     * Constructs a world
     * @param width Width in # of chunks
     * @param length Length in # of chunks
     * @param height Height of world
     */
    function WorldMap(width, height, length, gl, updateTracer) {
        this.lights = [
            new _Light__WEBPACK_IMPORTED_MODULE_1__.Light(gl_matrix__WEBPACK_IMPORTED_MODULE_7__.fromValues(0, 500, 0), new _terrains__WEBPACK_IMPORTED_MODULE_2__.Color(255, 255, 255), 1, 200, new _terrains__WEBPACK_IMPORTED_MODULE_2__.Color(255, 228, 132))
        ];
        this.resolution = 64; //#of vertices square size of chunk
        this.Workers = [];
        this.seed = 10; // Random seed for noise generation
        this.worldObjects = [];
        this.nextWorldObjectId = 0;
        this.tracerUpdateSupplier = updateTracer;
        this.gl = gl;
        this.width = width;
        this.length = length;
        this.height = height;
        this.chunks = [];
        for (var i = 0; i < navigator.hardwareConcurrency; i++) {
            this.Workers.push(new Worker(new URL(/* worker import */ __webpack_require__.p + __webpack_require__.u("src_map_Worker_ts"), __webpack_require__.b)));
        }
        this.generate();
        this.fieldMap = new Map();
        this.objectUI = new _ObjectUI__WEBPACK_IMPORTED_MODULE_6__.ObjectUI(this, this.tracerUpdateSupplier);
    }
    WorldMap.prototype.populateFieldMap = function () {
        for (var _i = 0, _a = this.chunks; _i < _a.length; _i++) {
            var chunk = _a[_i];
            for (var _b = 0, _c = Array.from(chunk.FieldMap.entries()); _b < _c.length; _b++) {
                var _d = _c[_b], key = _d[0], val = _d[1];
                this.fieldMap.set(key, val);
            }
        }
        for (var _e = 0, _f = this.chunks; _e < _f.length; _e++) {
            var chunk = _f[_e];
            chunk.setWorldFieldMap(this.fieldMap);
        }
    };
    //Generates map
    WorldMap.prototype.generate = function () {
        this.chunks = [
            // Row 1
            new _marching_cubes__WEBPACK_IMPORTED_MODULE_0__.Chunk(gl_matrix__WEBPACK_IMPORTED_MODULE_8__.fromValues(0, 0), gl_matrix__WEBPACK_IMPORTED_MODULE_7__.fromValues(this.resolution, this.height, this.resolution), this.seed, this.Workers[0]),
            new _marching_cubes__WEBPACK_IMPORTED_MODULE_0__.Chunk(gl_matrix__WEBPACK_IMPORTED_MODULE_8__.fromValues(this.resolution, 0), gl_matrix__WEBPACK_IMPORTED_MODULE_7__.fromValues(this.resolution, this.height, this.resolution), this.seed, this.Workers[1]),
            new _marching_cubes__WEBPACK_IMPORTED_MODULE_0__.Chunk(gl_matrix__WEBPACK_IMPORTED_MODULE_8__.fromValues(2 * this.resolution, 0), gl_matrix__WEBPACK_IMPORTED_MODULE_7__.fromValues(this.resolution, this.height, this.resolution), this.seed, this.Workers[2]),
            new _marching_cubes__WEBPACK_IMPORTED_MODULE_0__.Chunk(gl_matrix__WEBPACK_IMPORTED_MODULE_8__.fromValues(3 * this.resolution, 0), gl_matrix__WEBPACK_IMPORTED_MODULE_7__.fromValues(this.resolution, this.height, this.resolution), this.seed, this.Workers[3])
        ];
    };
    WorldMap.prototype.combinedMesh = function () {
        var CombinedMesh = new _Mesh__WEBPACK_IMPORTED_MODULE_3__.Mesh();
        // Merge chunks (these are already independent)
        for (var _i = 0, _a = this.chunks; _i < _a.length; _i++) {
            var chunk = _a[_i];
            CombinedMesh.merge(chunk.getMesh());
        }
        // Merge worldObjects with transformation applied
        for (var _b = 0, _c = this.worldObjects; _b < _c.length; _b++) {
            var obj = _c[_b];
            var meshCopy = obj.mesh.copy(); // copy original mesh
            var transformedMesh = new _Mesh__WEBPACK_IMPORTED_MODULE_3__.Mesh();
            for (var i = 0; i < meshCopy.mesh.length; i++) {
                var tri = meshCopy.mesh[i];
                var norm = meshCopy.normals[i];
                // Deep copy triangle and normal
                var newTri = [
                    gl_matrix__WEBPACK_IMPORTED_MODULE_7__.clone(tri[0]),
                    gl_matrix__WEBPACK_IMPORTED_MODULE_7__.clone(tri[1]),
                    gl_matrix__WEBPACK_IMPORTED_MODULE_7__.clone(tri[2])
                ];
                var newNorm = [
                    gl_matrix__WEBPACK_IMPORTED_MODULE_7__.clone(norm[0]),
                    gl_matrix__WEBPACK_IMPORTED_MODULE_7__.clone(norm[1]),
                    gl_matrix__WEBPACK_IMPORTED_MODULE_7__.clone(norm[2])
                ];
                // Apply transformation
                for (var j = 0; j < 3; j++) {
                    // Transform vertex
                    var v = gl_matrix__WEBPACK_IMPORTED_MODULE_9__.fromValues(newTri[j][0], newTri[j][1], newTri[j][2], 1);
                    gl_matrix__WEBPACK_IMPORTED_MODULE_9__.transformMat4(v, v, obj.position);
                    gl_matrix__WEBPACK_IMPORTED_MODULE_7__.set(newTri[j], v[0], v[1], v[2]);
                    // Transform normal (rotation + scale only)
                    var n = gl_matrix__WEBPACK_IMPORTED_MODULE_9__.fromValues(newNorm[j][0], newNorm[j][1], newNorm[j][2], 0);
                    var normalMat = gl_matrix__WEBPACK_IMPORTED_MODULE_10__.clone(obj.position);
                    normalMat[12] = 0;
                    normalMat[13] = 0;
                    normalMat[14] = 0;
                    gl_matrix__WEBPACK_IMPORTED_MODULE_9__.transformMat4(n, n, normalMat);
                    gl_matrix__WEBPACK_IMPORTED_MODULE_7__.normalize(newNorm[j], gl_matrix__WEBPACK_IMPORTED_MODULE_7__.fromValues(n[0], n[1], n[2]));
                }
                // Add transformed triangle
                transformedMesh.addTriangle(newTri, newNorm, meshCopy.type[i]);
            }
            // Merge safely into combined mesh
            CombinedMesh.merge(transformedMesh);
        }
        return CombinedMesh;
    };
    /**
     * Add an object to the game world
     */
    WorldMap.prototype.addObject = function (objectData, objectLocation, name) {
        var _a = (0,_cubes_utils__WEBPACK_IMPORTED_MODULE_5__.meshToVerticesAndIndices)(objectData), vertices = _a.vertices, indices = _a.indices;
        var meshSize = indices.length;
        var objectBuffer = _render_GlUtils__WEBPACK_IMPORTED_MODULE_4__.GlUtils.CreateStaticBuffer(this.gl, vertices, Array.from(indices));
        var worldObject = {
            buffer: objectBuffer,
            position: objectLocation,
            meshSize: meshSize,
            id: this.nextWorldObjectId,
            mesh: objectData,
            name: name
        };
        this.nextWorldObjectId++;
        this.worldObjects.push(worldObject);
        if (this.onObjectAdded) {
            this.onObjectAdded(worldObject);
        }
    };
    return WorldMap;
}());



/***/ }),

/***/ "./src/map/Mesh.ts":
/*!*************************!*\
  !*** ./src/map/Mesh.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Mesh: () => (/* binding */ Mesh)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var _terrains__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./terrains */ "./src/map/terrains.ts");
/* harmony import */ var _Utilities__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Utilities */ "./src/map/Utilities.ts");



/**
 * The "Mesh Class" - Stores the world's mesh
 */
var Mesh = /** @class */ (function () {
    function Mesh() {
        this.mesh = [];
        this.normals = [];
        this.type = []; // To be used when terrain types are implemented
    }
    /**
     * For when merging two meshes together
     * @param mesh2 Mesh to merge with the original one
     */
    Mesh.prototype.merge = function (mesh2) {
        var _a, _b, _c;
        (_a = this.mesh).push.apply(_a, mesh2.mesh);
        (_b = this.normals).push.apply(_b, mesh2.normals);
        (_c = this.type).push.apply(_c, mesh2.type);
    };
    /**
     * Adds triangle to mesh
     * @param triangle The triangle to add
     * @param normal The normals of the triangle to add
     * @param type (optional) the terrain types of the triangles to add
     */
    Mesh.prototype.addTriangle = function (triangle, normal, type) {
        if (type === void 0) { type = [0, 0, 0]; }
        this.mesh.push(triangle);
        this.normals.push(normal);
        this.type.push(type);
    };
    /**
     * Copies the mesh to another mesh (used generally for OOP to avoid funny pointer errors)
     * @returns A new Mesh with the same values
     */
    Mesh.prototype.copy = function () {
        var a = new Mesh();
        for (var i = 0; i < this.mesh.length; i++) {
            a.addTriangle(this.mesh[i], this.normals[i], this.type[i]);
        }
        return a;
    };
    /**
     * Translates the entire mesh
     * @param a The translation vector
     */
    Mesh.prototype.translate = function (a) {
        for (var i = 0; i < this.mesh.length; i++) {
            gl_matrix__WEBPACK_IMPORTED_MODULE_2__.add(this.mesh[i][0], this.mesh[i][0], a);
            gl_matrix__WEBPACK_IMPORTED_MODULE_2__.add(this.mesh[i][1], this.mesh[i][1], a);
            gl_matrix__WEBPACK_IMPORTED_MODULE_2__.add(this.mesh[i][2], this.mesh[i][2], a);
        }
    };
    /**
     * Scales the entire mesh
     * @param s Scaling factor
     */
    Mesh.prototype.scale = function (s) {
        for (var i = 0; i < this.mesh.length; i++) {
            this.mesh[i][0] = this.mesh[i][0].map(function (val) { return val * s; });
            this.mesh[i][1] = this.mesh[i][1].map(function (val) { return val * s; });
            this.mesh[i][2] = this.mesh[i][2].map(function (val) { return val * s; });
        }
    };
    Mesh.prototype.exportBVHTriangles = function () {
        var _this = this;
        return this.mesh.map(function (val, i, arr) {
            var center = gl_matrix__WEBPACK_IMPORTED_MODULE_2__.fromValues(_Utilities__WEBPACK_IMPORTED_MODULE_1__.Utilities.average([val[0][0], val[1][0], val[2][0]]), _Utilities__WEBPACK_IMPORTED_MODULE_1__.Utilities.average([val[0][1], val[1][1], val[2][1]]), _Utilities__WEBPACK_IMPORTED_MODULE_1__.Utilities.average([val[0][2], val[1][2], val[2][2]]));
            var terrain = _this.type[i].map(function (type) {
                return _terrains__WEBPACK_IMPORTED_MODULE_0__.Terrains[type];
            });
            var min = gl_matrix__WEBPACK_IMPORTED_MODULE_2__.fromValues(Math.min(val[0][0], val[1][0], val[2][0]), Math.min(val[0][1], val[1][1], val[2][1]), Math.min(val[0][2], val[1][2], val[2][2]));
            var max = gl_matrix__WEBPACK_IMPORTED_MODULE_2__.fromValues(Math.max(val[0][0], val[1][0], val[2][0]), Math.max(val[0][1], val[1][1], val[2][1]), Math.max(val[0][2], val[1][2], val[2][2]));
            return {
                triangle: val,
                center: center,
                boundingBox: { min: min, max: max },
                type: terrain,
                index: i,
                vertexNormals: _this.normals[i]
            };
        });
    };
    /**
     * Export BVH from BVH triangles
     */
    Mesh.exportBVH = function (triangles, depth) {
        if (depth === void 0) { depth = 0; }
        if (triangles.length <= 4) {
            var bbox = Mesh.computeBoundingBox.apply(Mesh, triangles.map(function (val) { return val.boundingBox; }));
            return {
                boundingBox: bbox,
                triangleIndices: triangles.map(function (val) { return val.index; })
            };
        }
        var axis = depth % 3;
        triangles.sort(function (a, b) { return a.center[axis] - b.center[axis]; });
        var mid = Math.floor(triangles.length / 2);
        var left = Mesh.exportBVH(triangles.slice(0, mid), depth + 1);
        var right = Mesh.exportBVH(triangles.slice(mid), depth + 1);
        return {
            boundingBox: Mesh.computeBoundingBox(left.boundingBox, right.boundingBox),
            left: left,
            right: right
        };
    };
    Mesh.computeBoundingBox = function () {
        var boxes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            boxes[_i] = arguments[_i];
        }
        var min = gl_matrix__WEBPACK_IMPORTED_MODULE_2__.fromValues(Math.min.apply(Math, boxes.map(function (val) { return val.min[0]; })), Math.min.apply(Math, boxes.map(function (val) { return val.min[1]; })), Math.min.apply(Math, boxes.map(function (val) { return val.min[2]; })));
        var max = gl_matrix__WEBPACK_IMPORTED_MODULE_2__.fromValues(Math.max.apply(Math, boxes.map(function (val) { return val.max[0]; })), Math.max.apply(Math, boxes.map(function (val) { return val.max[1]; })), Math.max.apply(Math, boxes.map(function (val) { return val.max[2]; })));
        return { max: max, min: min };
    };
    Mesh.flattenBVH = function (node) {
        var out = [];
        if (node.triangleIndices) {
            out.push({
                boundingBoxMin: node.boundingBox.min,
                boundingBoxMax: node.boundingBox.max,
                left: -1,
                right: -1,
                t1: node.triangleIndices[0] !== undefined ? node.triangleIndices[0] : -1,
                t2: node.triangleIndices[1] !== undefined ? node.triangleIndices[1] : -1,
                t3: node.triangleIndices[2] !== undefined ? node.triangleIndices[2] : -1,
                t4: node.triangleIndices[3] !== undefined ? node.triangleIndices[3] : -1
            });
        }
        else {
            var left = Mesh.flattenBVH(node.left);
            var right = Mesh.flattenBVH(node.right);
            //dummy -- will edit
            out.push({
                boundingBoxMin: node.boundingBox.min,
                boundingBoxMax: node.boundingBox.max,
                left: -1,
                right: -1,
                t1: -1,
                t2: -1,
                t3: -1,
                t4: -1
            });
            //Push sides
            var i1_1 = out.length; //Note: i1 should always be 1 but better practice
            out.push.apply(//Note: i1 should always be 1 but better practice
            out, left.map(function (val) {
                if (val.left != -1)
                    val.left += i1_1;
                if (val.right != -1)
                    val.right += i1_1;
                return val;
            }));
            var i2_1 = out.length;
            out.push.apply(out, right.map(function (val) {
                if (val.left != -1)
                    val.left += i2_1;
                if (val.right != -1)
                    val.right += i2_1;
                return val;
            }));
            out[0].left = i1_1;
            out[0].right = i2_1;
        }
        return out;
    };
    // Getter and Setter for vertices (mesh)
    Mesh.prototype.getVertices = function () {
        return this.mesh;
    };
    Mesh.prototype.setVertices = function (value) {
        this.mesh = value;
    };
    // Getter and Setter for normals
    Mesh.prototype.getNormals = function () {
        return this.normals;
    };
    Mesh.prototype.setNormals = function (value) {
        this.normals = value;
    };
    // Getter and Setter for type
    Mesh.prototype.getTypes = function () {
        return this.type;
    };
    Mesh.prototype.setTypes = function (value) {
        this.type = value;
    };
    return Mesh;
}());



/***/ }),

/***/ "./src/map/ObjectUI.ts":
/*!*****************************!*\
  !*** ./src/map/ObjectUI.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ObjectUI: () => (/* binding */ ObjectUI)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var _modelLoader_3fmreader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../modelLoader/3fmreader */ "./src/modelLoader/3fmreader.ts");
/* harmony import */ var _modelLoader_objreader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../modelLoader/objreader */ "./src/modelLoader/objreader.ts");
/* harmony import */ var _terrains__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./terrains */ "./src/map/terrains.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};




var ObjectUI = /** @class */ (function () {
    function ObjectUI(map, updateTracer) {
        var _this = this;
        this.tracerUpdateSupplier = updateTracer;
        var popup = document.getElementById("popup");
        var openBtn = document.getElementById("open-popup-btn");
        var closeBtn = document.getElementById("close-popup-btn");
        var submitBtn = document.getElementById("submit-object");
        var addMapEntryBtn = document.getElementById("add-map-entry");
        var importMapDiv = document.getElementById("import-map");
        var fileInput = document.getElementById("ply-file");
        var nameInput = document.getElementById("object-name");
        openBtn.addEventListener("click", function () { return popup.classList.remove("hidden"); });
        closeBtn.addEventListener("click", function () { return popup.classList.add("hidden"); });
        // Add mapping UI
        addMapEntryBtn.addEventListener("click", function () {
            var wrapper = document.createElement("div");
            wrapper.className = "map-entry";
            // Color input
            var colorInput = document.createElement("input");
            colorInput.type = "color";
            // Terrain type select
            var terrainSelect = document.createElement("select");
            [1, 2, 3, 4, 5].forEach(function (t) {
                var opt = document.createElement("option");
                opt.value = t.toString();
                opt.textContent = "Type ".concat(t);
                terrainSelect.appendChild(opt);
            });
            // Reflectiveness
            var reflectInput = document.createElement("input");
            reflectInput.type = "number";
            reflectInput.step = "0.1";
            reflectInput.min = "0";
            reflectInput.max = "1";
            reflectInput.value = "0.5";
            // Roughness
            var roughInput = document.createElement("input");
            roughInput.type = "number";
            roughInput.step = "0.1";
            roughInput.min = "0";
            roughInput.max = "1";
            roughInput.value = "0.5";
            wrapper.append("Color: ", colorInput, " Terrain: ", terrainSelect, " Reflect: ", reflectInput, " Rough: ", roughInput);
            importMapDiv.appendChild(wrapper);
        });
        // Handle submission
        submitBtn.addEventListener("click", function () { return __awaiter(_this, void 0, void 0, function () {
            var file, importMap, mesh, plyText, fileUrl, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        file = (_b = fileInput.files) === null || _b === void 0 ? void 0 : _b[0];
                        // 1. UPDATED: Validate for either .ply or .3mf
                        if (!file ||
                            !(file.name.endsWith(".ply") ||
                                file.name.endsWith(".3mf") ||
                                file.name.endsWith(".obj"))) {
                            alert("Please upload a valid .ply, .3mf, or .obj file.");
                            return [2 /*return*/];
                        }
                        if (!nameInput.value.trim()) {
                            alert("Please enter a name for the object.");
                            return [2 /*return*/];
                        }
                        importMap = {};
                        document.querySelectorAll(".map-entry").forEach(function (entry) {
                            var inputs = entry.querySelectorAll("input, select");
                            var color = _terrains__WEBPACK_IMPORTED_MODULE_2__.Color.fromHex(inputs[0].value);
                            var type = parseInt(inputs[1].value);
                            _terrains__WEBPACK_IMPORTED_MODULE_2__.Terrains[Object.keys(_terrains__WEBPACK_IMPORTED_MODULE_2__.Terrains).length] = {
                                color: color,
                                reflectiveness: Math.min(1, Math.max(0, parseFloat(inputs[2].value))),
                                roughness: Math.min(1, Math.max(0, parseFloat(inputs[3].value))),
                                type: type
                            };
                            importMap[color.toString()] = Object.keys(_terrains__WEBPACK_IMPORTED_MODULE_2__.Terrains).length - 1;
                        });
                        if (!file.name.endsWith(".ply")) return [3 /*break*/, 2];
                        return [4 /*yield*/, file.text()];
                    case 1:
                        plyText = _c.sent();
                        mesh = (0,_modelLoader_objreader__WEBPACK_IMPORTED_MODULE_1__.loadPLYToMesh)(plyText, importMap);
                        return [3 /*break*/, 7];
                    case 2:
                        if (!file.name.endsWith(".3mf")) return [3 /*break*/, 4];
                        fileUrl = URL.createObjectURL(file);
                        return [4 /*yield*/, (0,_modelLoader_3fmreader__WEBPACK_IMPORTED_MODULE_0__.threemfToMesh)(fileUrl, importMap)];
                    case 3:
                        mesh = _c.sent();
                        URL.revokeObjectURL(fileUrl); // Clean up the temporary URL after loading
                        return [3 /*break*/, 7];
                    case 4:
                        if (!file.name.endsWith(".obj")) return [3 /*break*/, 6];
                        if (Object.keys(importMap).length != 0) {
                            alert("OBJ import with color mapping is not yet supported.");
                            return [2 /*return*/];
                        }
                        _a = _modelLoader_objreader__WEBPACK_IMPORTED_MODULE_1__.objSourceToMesh;
                        return [4 /*yield*/, file.text()];
                    case 5:
                        mesh = _a.apply(void 0, [_c.sent()]);
                        return [3 /*break*/, 7];
                    case 6:
                        // This case should not be reached due to the validation above, but it's good practice
                        alert("Unsupported file type.");
                        return [2 /*return*/];
                    case 7:
                        // This part remains the same, as it works with the generic Mesh object
                        map.addObject(mesh, gl_matrix__WEBPACK_IMPORTED_MODULE_3__.create(), nameInput.value.trim());
                        // Reset + close popup
                        importMapDiv.innerHTML = "";
                        fileInput.value = "";
                        nameInput.value = "";
                        popup.classList.add("hidden");
                        // Generate for pathtracing
                        if (this.tracerUpdateSupplier)
                            this.tracerUpdateSupplier()();
                        return [2 /*return*/];
                }
            });
        }); });
        var container = document.getElementById("world-objects");
        this.setupObjectUI(map, container, this);
    }
    ObjectUI.prototype.setupObjectUI = function (world, container, UI) {
        world.onObjectAdded = function (obj) {
            var wrapper = document.createElement("div");
            wrapper.className = "world-object";
            // Name
            var nameEl = document.createElement("h3");
            nameEl.textContent = obj.name;
            wrapper.appendChild(nameEl);
            // Vertex count
            var vertsEl = document.createElement("p");
            vertsEl.textContent = "Vertices: ".concat(obj.mesh.mesh.length * 3);
            wrapper.appendChild(vertsEl);
            // Delete button
            var deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete Object";
            deleteBtn.style.marginBottom = "10px";
            deleteBtn.addEventListener("click", function () {
                // Remove from world
                world.worldObjects = world.worldObjects.filter(function (o) { return o.id !== obj.id; });
                // Remove UI
                wrapper.remove();
                // Trigger re-trace/update if needed
                if (UI.tracerUpdateSupplier)
                    UI.tracerUpdateSupplier()();
            });
            wrapper.appendChild(deleteBtn);
            // Helper to create labeled number input
            function createInput(labelText, value, onChange) {
                var label = document.createElement("label");
                label.innerHTML = "<br>".concat(labelText, ": ");
                var input = document.createElement("input");
                input.type = "number";
                input.value = value.toString();
                input.step = "0.1";
                input.addEventListener("input", function () {
                    var val = input.value === "" ? 0 : parseFloat(input.value);
                    onChange(val);
                });
                label.appendChild(input);
                wrapper.appendChild(label);
            }
            // Extract current transform components
            var translation = [
                obj.position[12],
                obj.position[13],
                obj.position[14]
            ];
            var rotationDegrees = [0, 0, 0]; // default 0 or store separately in WorldObject
            var scale = [1, 1, 1]; // default 1 or store separately
            // Function to rebuild mat4 from translation, rotation, scale
            function rebuildMatrix() {
                var rad = rotationDegrees.map(function (d) { return (d * Math.PI) / 180; });
                var newMat = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.create();
                gl_matrix__WEBPACK_IMPORTED_MODULE_3__.translate(newMat, newMat, gl_matrix__WEBPACK_IMPORTED_MODULE_4__.fromValues(translation[0], translation[1], translation[2]));
                gl_matrix__WEBPACK_IMPORTED_MODULE_3__.rotateX(newMat, newMat, rad[0]);
                gl_matrix__WEBPACK_IMPORTED_MODULE_3__.rotateY(newMat, newMat, rad[1]);
                gl_matrix__WEBPACK_IMPORTED_MODULE_3__.rotateZ(newMat, newMat, rad[2]);
                gl_matrix__WEBPACK_IMPORTED_MODULE_3__.scale(newMat, newMat, gl_matrix__WEBPACK_IMPORTED_MODULE_4__.fromValues(scale[0], scale[1], scale[2]));
                gl_matrix__WEBPACK_IMPORTED_MODULE_3__.copy(obj.position, newMat);
                if (UI.tracerUpdateSupplier)
                    UI.tracerUpdateSupplier()();
            }
            // Translation inputs
            var tHeader = document.createElement("h4");
            tHeader.textContent = "Translation:";
            wrapper.appendChild(tHeader);
            ["X", "Y", "Z"].forEach(function (axis, i) {
                return createInput(axis, translation[i], function (v) {
                    translation[i] = v;
                    rebuildMatrix();
                });
            });
            // Rotation inputs (degrees)
            var rHeader = document.createElement("h4");
            rHeader.textContent = "Rotation (degrees):";
            wrapper.appendChild(rHeader);
            ["X", "Y", "Z"].forEach(function (axis, i) {
                return createInput(axis, rotationDegrees[i], function (v) {
                    rotationDegrees[i] = v;
                    rebuildMatrix();
                });
            });
            // Scale inputs
            var sHeader = document.createElement("h4");
            sHeader.textContent = "Scale:";
            wrapper.appendChild(sHeader);
            ["X", "Y", "Z"].forEach(function (axis, i) {
                return createInput(axis, scale[i], function (v) {
                    scale[i] = v;
                    rebuildMatrix();
                });
            });
            container.appendChild(wrapper);
        };
    };
    return ObjectUI;
}());



/***/ }),

/***/ "./src/map/Utilities.ts":
/*!******************************!*\
  !*** ./src/map/Utilities.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Utilities: () => (/* binding */ Utilities)
/* harmony export */ });
var Utilities = /** @class */ (function () {
    function Utilities() {
    }
    Utilities.average = function (l) {
        return l.reduce(function (a, b) { return a + b; }) / l.length;
    };
    return Utilities;
}());



/***/ }),

/***/ "./src/map/cubes_utils.ts":
/*!********************************!*\
  !*** ./src/map/cubes_utils.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   meshToVerticesAndIndices: () => (/* binding */ meshToVerticesAndIndices),
/* harmony export */   vertexKey: () => (/* binding */ vertexKey)
/* harmony export */ });
/* harmony import */ var _terrains__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./terrains */ "./src/map/terrains.ts");

var roundToPrecision = function (value, precision) {
    return Math.round(value * precision) / precision;
};
var vertexKey = function (vertex) {
    return "".concat(roundToPrecision(vertex[0], 1e2), ",").concat(roundToPrecision(vertex[1], 1e2), ",").concat(roundToPrecision(vertex[2], 1e2));
};
var meshToVerticesAndIndices = function (mesh) {
    // For each vertex: x, y, z, r, g, b
    var vertexMap = new Map();
    var vertices = [];
    var indices = [];
    var vertexIndex = 0;
    for (var i = 0; i < mesh.mesh.length; i++) {
        var triangle = mesh.mesh[i];
        var types = mesh.type[i];
        for (var j = 0; j < 3; j++) {
            var vertex = triangle[j];
            var normal = mesh.normals[i][j];
            var key = vertexKey(vertex);
            if (!vertexMap.has(key)) {
                var type = _terrains__WEBPACK_IMPORTED_MODULE_0__.Terrains[types[j]];
                var color = type.color;
                vertices.push(vertex[0], vertex[1], vertex[2], normal[0], normal[1], normal[2], color.r / 255, color.g / 255, color.b / 255);
                vertexMap.set(key, vertexIndex);
                vertexIndex++;
            }
            indices.push(vertexMap.get(key)); // Store the index of the vertex
        }
    }
    return {
        vertices: new Float32Array(vertices),
        indices: new Uint32Array(indices)
    };
};


/***/ }),

/***/ "./src/map/geometry.ts":
/*!*****************************!*\
  !*** ./src/map/geometry.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CASES: () => (/* binding */ CASES),
/* harmony export */   EDGES: () => (/* binding */ EDGES),
/* harmony export */   VERTICES: () => (/* binding */ VERTICES),
/* harmony export */   cubeVertices: () => (/* binding */ cubeVertices),
/* harmony export */   cubeWireframeIndices: () => (/* binding */ cubeWireframeIndices)
/* harmony export */ });
// Shoutout to BorisTheBrave https://github.com/BorisTheBrave/mc-dc/blob/a165b326849d8814fb03c963ad33a9faf6cc6dea/marching_cubes_3d.py
var VERTICES = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1]
];
var EDGES = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7]
];
//prettier-ignore
var CASES = [[],
    [[8, 0, 3]],
    [[1, 0, 9]],
    [[8, 1, 3], [8, 9, 1]],
    [[10, 2, 1]],
    [[8, 0, 3], [1, 10, 2]],
    [[9, 2, 0], [9, 10, 2]],
    [[3, 8, 2], [2, 8, 10], [10, 8, 9]],
    [[3, 2, 11]],
    [[0, 2, 8], [2, 11, 8]],
    [[1, 0, 9], [2, 11, 3]],
    [[2, 9, 1], [11, 9, 2], [8, 9, 11]],
    [[3, 10, 11], [3, 1, 10]],
    [[1, 10, 0], [0, 10, 8], [8, 10, 11]],
    [[0, 11, 3], [9, 11, 0], [10, 11, 9]],
    [[8, 9, 11], [11, 9, 10]],
    [[7, 4, 8]],
    [[3, 7, 0], [7, 4, 0]],
    [[7, 4, 8], [9, 1, 0]],
    [[9, 1, 4], [4, 1, 7], [7, 1, 3]],
    [[7, 4, 8], [2, 1, 10]],
    [[4, 3, 7], [4, 0, 3], [2, 1, 10]],
    [[2, 0, 10], [0, 9, 10], [7, 4, 8]],
    [[9, 10, 4], [4, 10, 3], [3, 10, 2], [4, 3, 7]],
    [[4, 8, 7], [3, 2, 11]],
    [[7, 4, 11], [11, 4, 2], [2, 4, 0]],
    [[1, 0, 9], [2, 11, 3], [8, 7, 4]],
    [[2, 11, 1], [1, 11, 9], [9, 11, 7], [9, 7, 4]],
    [[10, 11, 1], [11, 3, 1], [4, 8, 7]],
    [[4, 0, 7], [7, 0, 10], [0, 1, 10], [7, 10, 11]],
    [[7, 4, 8], [0, 11, 3], [9, 11, 0], [10, 11, 9]],
    [[4, 11, 7], [9, 11, 4], [10, 11, 9]],
    [[9, 4, 5]],
    [[9, 4, 5], [0, 3, 8]],
    [[0, 5, 1], [0, 4, 5]],
    [[4, 3, 8], [5, 3, 4], [1, 3, 5]],
    [[5, 9, 4], [10, 2, 1]],
    [[8, 0, 3], [1, 10, 2], [4, 5, 9]],
    [[10, 4, 5], [2, 4, 10], [0, 4, 2]],
    [[3, 10, 2], [8, 10, 3], [5, 10, 8], [4, 5, 8]],
    [[9, 4, 5], [11, 3, 2]],
    [[11, 0, 2], [11, 8, 0], [9, 4, 5]],
    [[5, 1, 4], [1, 0, 4], [11, 3, 2]],
    [[5, 1, 4], [4, 1, 11], [1, 2, 11], [4, 11, 8]],
    [[3, 10, 11], [3, 1, 10], [5, 9, 4]],
    [[9, 4, 5], [1, 10, 0], [0, 10, 8], [8, 10, 11]],
    [[5, 0, 4], [11, 0, 5], [11, 3, 0], [10, 11, 5]],
    [[5, 10, 4], [4, 10, 8], [8, 10, 11]],
    [[9, 7, 5], [9, 8, 7]],
    [[0, 5, 9], [3, 5, 0], [7, 5, 3]],
    [[8, 7, 0], [0, 7, 1], [1, 7, 5]],
    [[7, 5, 3], [3, 5, 1]],
    [[7, 5, 8], [5, 9, 8], [2, 1, 10]],
    [[10, 2, 1], [0, 5, 9], [3, 5, 0], [7, 5, 3]],
    [[8, 2, 0], [5, 2, 8], [10, 2, 5], [7, 5, 8]],
    [[2, 3, 10], [10, 3, 5], [5, 3, 7]],
    [[9, 7, 5], [9, 8, 7], [11, 3, 2]],
    [[0, 2, 9], [9, 2, 7], [7, 2, 11], [9, 7, 5]],
    [[3, 2, 11], [8, 7, 0], [0, 7, 1], [1, 7, 5]],
    [[11, 1, 2], [7, 1, 11], [5, 1, 7]],
    [[3, 1, 11], [11, 1, 10], [8, 7, 9], [9, 7, 5]],
    [[11, 7, 0], [7, 5, 0], [5, 9, 0], [10, 11, 0], [1, 10, 0]],
    [[0, 5, 10], [0, 7, 5], [0, 8, 7], [0, 10, 11], [0, 11, 3]],
    [[10, 11, 5], [11, 7, 5]],
    [[5, 6, 10]],
    [[8, 0, 3], [10, 5, 6]],
    [[0, 9, 1], [5, 6, 10]],
    [[8, 1, 3], [8, 9, 1], [10, 5, 6]],
    [[1, 6, 2], [1, 5, 6]],
    [[6, 2, 5], [2, 1, 5], [8, 0, 3]],
    [[5, 6, 9], [9, 6, 0], [0, 6, 2]],
    [[5, 8, 9], [2, 8, 5], [3, 8, 2], [6, 2, 5]],
    [[3, 2, 11], [10, 5, 6]],
    [[0, 2, 8], [2, 11, 8], [5, 6, 10]],
    [[3, 2, 11], [0, 9, 1], [10, 5, 6]],
    [[5, 6, 10], [2, 9, 1], [11, 9, 2], [8, 9, 11]],
    [[11, 3, 6], [6, 3, 5], [5, 3, 1]],
    [[11, 8, 6], [6, 8, 1], [1, 8, 0], [6, 1, 5]],
    [[5, 0, 9], [6, 0, 5], [3, 0, 6], [11, 3, 6]],
    [[6, 9, 5], [11, 9, 6], [8, 9, 11]],
    [[7, 4, 8], [6, 10, 5]],
    [[3, 7, 0], [7, 4, 0], [10, 5, 6]],
    [[7, 4, 8], [6, 10, 5], [9, 1, 0]],
    [[5, 6, 10], [9, 1, 4], [4, 1, 7], [7, 1, 3]],
    [[1, 6, 2], [1, 5, 6], [7, 4, 8]],
    [[6, 1, 5], [2, 1, 6], [0, 7, 4], [3, 7, 0]],
    [[4, 8, 7], [5, 6, 9], [9, 6, 0], [0, 6, 2]],
    [[2, 3, 9], [3, 7, 9], [7, 4, 9], [6, 2, 9], [5, 6, 9]],
    [[2, 11, 3], [7, 4, 8], [10, 5, 6]],
    [[6, 10, 5], [7, 4, 11], [11, 4, 2], [2, 4, 0]],
    [[1, 0, 9], [8, 7, 4], [3, 2, 11], [5, 6, 10]],
    [[1, 2, 9], [9, 2, 11], [9, 11, 4], [4, 11, 7], [5, 6, 10]],
    [[7, 4, 8], [11, 3, 6], [6, 3, 5], [5, 3, 1]],
    [[11, 0, 1], [11, 4, 0], [11, 7, 4], [11, 1, 5], [11, 5, 6]],
    [[6, 9, 5], [0, 9, 6], [11, 0, 6], [3, 0, 11], [4, 8, 7]],
    [[5, 6, 9], [9, 6, 11], [9, 11, 7], [9, 7, 4]],
    [[4, 10, 9], [4, 6, 10]],
    [[10, 4, 6], [10, 9, 4], [8, 0, 3]],
    [[1, 0, 10], [10, 0, 6], [6, 0, 4]],
    [[8, 1, 3], [6, 1, 8], [6, 10, 1], [4, 6, 8]],
    [[9, 2, 1], [4, 2, 9], [6, 2, 4]],
    [[3, 8, 0], [9, 2, 1], [4, 2, 9], [6, 2, 4]],
    [[0, 4, 2], [2, 4, 6]],
    [[8, 2, 3], [4, 2, 8], [6, 2, 4]],
    [[4, 10, 9], [4, 6, 10], [2, 11, 3]],
    [[11, 8, 2], [2, 8, 0], [6, 10, 4], [4, 10, 9]],
    [[2, 11, 3], [1, 0, 10], [10, 0, 6], [6, 0, 4]],
    [[8, 4, 1], [4, 6, 1], [6, 10, 1], [11, 8, 1], [2, 11, 1]],
    [[3, 1, 11], [11, 1, 4], [1, 9, 4], [11, 4, 6]],
    [[6, 11, 1], [11, 8, 1], [8, 0, 1], [4, 6, 1], [9, 4, 1]],
    [[3, 0, 11], [11, 0, 6], [6, 0, 4]],
    [[4, 11, 8], [4, 6, 11]],
    [[6, 8, 7], [10, 8, 6], [9, 8, 10]],
    [[3, 7, 0], [0, 7, 10], [7, 6, 10], [0, 10, 9]],
    [[1, 6, 10], [0, 6, 1], [7, 6, 0], [8, 7, 0]],
    [[10, 1, 6], [6, 1, 7], [7, 1, 3]],
    [[9, 8, 1], [1, 8, 6], [6, 8, 7], [1, 6, 2]],
    [[9, 7, 6], [9, 3, 7], [9, 0, 3], [9, 6, 2], [9, 2, 1]],
    [[7, 6, 8], [8, 6, 0], [0, 6, 2]],
    [[3, 6, 2], [3, 7, 6]],
    [[3, 2, 11], [6, 8, 7], [10, 8, 6], [9, 8, 10]],
    [[7, 9, 0], [7, 10, 9], [7, 6, 10], [7, 0, 2], [7, 2, 11]],
    [[0, 10, 1], [6, 10, 0], [8, 6, 0], [7, 6, 8], [2, 11, 3]],
    [[1, 6, 10], [7, 6, 1], [11, 7, 1], [2, 11, 1]],
    [[1, 9, 6], [9, 8, 6], [8, 7, 6], [3, 1, 6], [11, 3, 6]],
    [[9, 0, 1], [11, 7, 6]],
    [[0, 11, 3], [6, 11, 0], [7, 6, 0], [8, 7, 0]],
    [[7, 6, 11]],
    [[11, 6, 7]],
    [[3, 8, 0], [11, 6, 7]],
    [[1, 0, 9], [6, 7, 11]],
    [[1, 3, 9], [3, 8, 9], [6, 7, 11]],
    [[10, 2, 1], [6, 7, 11]],
    [[10, 2, 1], [3, 8, 0], [6, 7, 11]],
    [[9, 2, 0], [9, 10, 2], [11, 6, 7]],
    [[11, 6, 7], [3, 8, 2], [2, 8, 10], [10, 8, 9]],
    [[2, 6, 3], [6, 7, 3]],
    [[8, 6, 7], [0, 6, 8], [2, 6, 0]],
    [[7, 2, 6], [7, 3, 2], [1, 0, 9]],
    [[8, 9, 7], [7, 9, 2], [2, 9, 1], [7, 2, 6]],
    [[6, 1, 10], [7, 1, 6], [3, 1, 7]],
    [[8, 0, 7], [7, 0, 6], [6, 0, 1], [6, 1, 10]],
    [[7, 3, 6], [6, 3, 9], [3, 0, 9], [6, 9, 10]],
    [[7, 8, 6], [6, 8, 10], [10, 8, 9]],
    [[8, 11, 4], [11, 6, 4]],
    [[11, 0, 3], [6, 0, 11], [4, 0, 6]],
    [[6, 4, 11], [4, 8, 11], [1, 0, 9]],
    [[1, 3, 9], [9, 3, 6], [3, 11, 6], [9, 6, 4]],
    [[8, 11, 4], [11, 6, 4], [1, 10, 2]],
    [[1, 10, 2], [11, 0, 3], [6, 0, 11], [4, 0, 6]],
    [[2, 9, 10], [0, 9, 2], [4, 11, 6], [8, 11, 4]],
    [[3, 4, 9], [3, 6, 4], [3, 11, 6], [3, 9, 10], [3, 10, 2]],
    [[3, 2, 8], [8, 2, 4], [4, 2, 6]],
    [[2, 4, 0], [6, 4, 2]],
    [[0, 9, 1], [3, 2, 8], [8, 2, 4], [4, 2, 6]],
    [[1, 2, 9], [9, 2, 4], [4, 2, 6]],
    [[10, 3, 1], [4, 3, 10], [4, 8, 3], [6, 4, 10]],
    [[10, 0, 1], [6, 0, 10], [4, 0, 6]],
    [[3, 10, 6], [3, 9, 10], [3, 0, 9], [3, 6, 4], [3, 4, 8]],
    [[9, 10, 4], [10, 6, 4]],
    [[9, 4, 5], [7, 11, 6]],
    [[9, 4, 5], [7, 11, 6], [0, 3, 8]],
    [[0, 5, 1], [0, 4, 5], [6, 7, 11]],
    [[11, 6, 7], [4, 3, 8], [5, 3, 4], [1, 3, 5]],
    [[1, 10, 2], [9, 4, 5], [6, 7, 11]],
    [[8, 0, 3], [4, 5, 9], [10, 2, 1], [11, 6, 7]],
    [[7, 11, 6], [10, 4, 5], [2, 4, 10], [0, 4, 2]],
    [[8, 2, 3], [10, 2, 8], [4, 10, 8], [5, 10, 4], [11, 6, 7]],
    [[2, 6, 3], [6, 7, 3], [9, 4, 5]],
    [[5, 9, 4], [8, 6, 7], [0, 6, 8], [2, 6, 0]],
    [[7, 3, 6], [6, 3, 2], [4, 5, 0], [0, 5, 1]],
    [[8, 1, 2], [8, 5, 1], [8, 4, 5], [8, 2, 6], [8, 6, 7]],
    [[9, 4, 5], [6, 1, 10], [7, 1, 6], [3, 1, 7]],
    [[7, 8, 6], [6, 8, 0], [6, 0, 10], [10, 0, 1], [5, 9, 4]],
    [[3, 0, 10], [0, 4, 10], [4, 5, 10], [7, 3, 10], [6, 7, 10]],
    [[8, 6, 7], [10, 6, 8], [5, 10, 8], [4, 5, 8]],
    [[5, 9, 6], [6, 9, 11], [11, 9, 8]],
    [[11, 6, 3], [3, 6, 0], [0, 6, 5], [0, 5, 9]],
    [[8, 11, 0], [0, 11, 5], [5, 11, 6], [0, 5, 1]],
    [[6, 3, 11], [5, 3, 6], [1, 3, 5]],
    [[10, 2, 1], [5, 9, 6], [6, 9, 11], [11, 9, 8]],
    [[3, 11, 0], [0, 11, 6], [0, 6, 9], [9, 6, 5], [1, 10, 2]],
    [[0, 8, 5], [8, 11, 5], [11, 6, 5], [2, 0, 5], [10, 2, 5]],
    [[11, 6, 3], [3, 6, 5], [3, 5, 10], [3, 10, 2]],
    [[3, 9, 8], [6, 9, 3], [5, 9, 6], [2, 6, 3]],
    [[9, 6, 5], [0, 6, 9], [2, 6, 0]],
    [[6, 5, 8], [5, 1, 8], [1, 0, 8], [2, 6, 8], [3, 2, 8]],
    [[2, 6, 1], [6, 5, 1]],
    [[6, 8, 3], [6, 9, 8], [6, 5, 9], [6, 3, 1], [6, 1, 10]],
    [[1, 10, 0], [0, 10, 6], [0, 6, 5], [0, 5, 9]],
    [[3, 0, 8], [6, 5, 10]],
    [[10, 6, 5]],
    [[5, 11, 10], [5, 7, 11]],
    [[5, 11, 10], [5, 7, 11], [3, 8, 0]],
    [[11, 10, 7], [10, 5, 7], [0, 9, 1]],
    [[5, 7, 10], [10, 7, 11], [9, 1, 8], [8, 1, 3]],
    [[2, 1, 11], [11, 1, 7], [7, 1, 5]],
    [[3, 8, 0], [2, 1, 11], [11, 1, 7], [7, 1, 5]],
    [[2, 0, 11], [11, 0, 5], [5, 0, 9], [11, 5, 7]],
    [[2, 9, 5], [2, 8, 9], [2, 3, 8], [2, 5, 7], [2, 7, 11]],
    [[10, 3, 2], [5, 3, 10], [7, 3, 5]],
    [[10, 0, 2], [7, 0, 10], [8, 0, 7], [5, 7, 10]],
    [[0, 9, 1], [10, 3, 2], [5, 3, 10], [7, 3, 5]],
    [[7, 8, 2], [8, 9, 2], [9, 1, 2], [5, 7, 2], [10, 5, 2]],
    [[3, 1, 7], [7, 1, 5]],
    [[0, 7, 8], [1, 7, 0], [5, 7, 1]],
    [[9, 5, 0], [0, 5, 3], [3, 5, 7]],
    [[5, 7, 9], [7, 8, 9]],
    [[4, 10, 5], [8, 10, 4], [11, 10, 8]],
    [[3, 4, 0], [10, 4, 3], [10, 5, 4], [11, 10, 3]],
    [[1, 0, 9], [4, 10, 5], [8, 10, 4], [11, 10, 8]],
    [[4, 3, 11], [4, 1, 3], [4, 9, 1], [4, 11, 10], [4, 10, 5]],
    [[1, 5, 2], [2, 5, 8], [5, 4, 8], [2, 8, 11]],
    [[5, 4, 11], [4, 0, 11], [0, 3, 11], [1, 5, 11], [2, 1, 11]],
    [[5, 11, 2], [5, 8, 11], [5, 4, 8], [5, 2, 0], [5, 0, 9]],
    [[5, 4, 9], [2, 3, 11]],
    [[3, 4, 8], [2, 4, 3], [5, 4, 2], [10, 5, 2]],
    [[5, 4, 10], [10, 4, 2], [2, 4, 0]],
    [[2, 8, 3], [4, 8, 2], [10, 4, 2], [5, 4, 10], [0, 9, 1]],
    [[4, 10, 5], [2, 10, 4], [1, 2, 4], [9, 1, 4]],
    [[8, 3, 4], [4, 3, 5], [5, 3, 1]],
    [[1, 5, 0], [5, 4, 0]],
    [[5, 0, 9], [3, 0, 5], [8, 3, 5], [4, 8, 5]],
    [[5, 4, 9]],
    [[7, 11, 4], [4, 11, 9], [9, 11, 10]],
    [[8, 0, 3], [7, 11, 4], [4, 11, 9], [9, 11, 10]],
    [[0, 4, 1], [1, 4, 11], [4, 7, 11], [1, 11, 10]],
    [[10, 1, 4], [1, 3, 4], [3, 8, 4], [11, 10, 4], [7, 11, 4]],
    [[9, 4, 1], [1, 4, 2], [2, 4, 7], [2, 7, 11]],
    [[1, 9, 2], [2, 9, 4], [2, 4, 11], [11, 4, 7], [3, 8, 0]],
    [[11, 4, 7], [2, 4, 11], [0, 4, 2]],
    [[7, 11, 4], [4, 11, 2], [4, 2, 3], [4, 3, 8]],
    [[10, 9, 2], [2, 9, 7], [7, 9, 4], [2, 7, 3]],
    [[2, 10, 7], [10, 9, 7], [9, 4, 7], [0, 2, 7], [8, 0, 7]],
    [[10, 4, 7], [10, 0, 4], [10, 1, 0], [10, 7, 3], [10, 3, 2]],
    [[8, 4, 7], [10, 1, 2]],
    [[4, 1, 9], [7, 1, 4], [3, 1, 7]],
    [[8, 0, 7], [7, 0, 1], [7, 1, 9], [7, 9, 4]],
    [[0, 7, 3], [0, 4, 7]],
    [[8, 4, 7]],
    [[9, 8, 10], [10, 8, 11]],
    [[3, 11, 0], [0, 11, 9], [9, 11, 10]],
    [[0, 10, 1], [8, 10, 0], [11, 10, 8]],
    [[11, 10, 3], [10, 1, 3]],
    [[1, 9, 2], [2, 9, 11], [11, 9, 8]],
    [[9, 2, 1], [11, 2, 9], [3, 11, 9], [0, 3, 9]],
    [[8, 2, 0], [8, 11, 2]],
    [[11, 2, 3]],
    [[2, 8, 3], [10, 8, 2], [9, 8, 10]],
    [[0, 2, 9], [2, 10, 9]],
    [[3, 2, 8], [8, 2, 10], [8, 10, 1], [8, 1, 0]],
    [[1, 2, 10]],
    [[3, 1, 8], [1, 9, 8]],
    [[9, 0, 1]],
    [[3, 0, 8]],
    []];
var cubeVertices = new Float32Array([
    // x, y, z, r, g, b
    0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0,
    1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0
]);
var cubeWireframeIndices = [
    // 12 edges × 2 vertices = 24 indices
    0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7
];


/***/ }),

/***/ "./src/map/marching_cubes.ts":
/*!***********************************!*\
  !*** ./src/map/marching_cubes.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Chunk: () => (/* binding */ Chunk)
/* harmony export */ });
/* harmony import */ var _Mesh__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Mesh */ "./src/map/Mesh.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};

//!NOTE: current code assumes a chunk size of GridSize[0]xGridSize[1]xGridSize[2]
var Chunk = /** @class */ (function () {
    function Chunk(ChunkPosition, GridSize, seed, Worker) {
        this.Field = new Float32Array();
        this.WorldFieldMap = new Map();
        this.Mesh = null;
        this.GridSize = GridSize;
        this.ChunkPosition = ChunkPosition;
        this.seed = seed;
        this.Worker = Worker;
        this.FieldMap = new Map();
    }
    Chunk.prototype.chunkCoordinateToIndex = function (c) {
        return (c[0] +
            c[1] * (this.GridSize[0] + 1) +
            c[2] * (this.GridSize[0] + 1) * (this.GridSize[1] + 1));
    };
    Chunk.prototype.setWorldFieldMap = function (worldFieldMap) {
        this.WorldFieldMap = worldFieldMap;
    };
    Chunk.prototype.generateTerrain = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        _this.Worker.postMessage({
                            GridSize: _this.GridSize,
                            ChunkPosition: _this.ChunkPosition,
                            Seed: _this.seed,
                            generatingTerrain: true,
                            worldFieldMap: _this.FieldMap
                        });
                        _this.Worker.onmessage = function (event) {
                            _this.Field = event.data.field;
                            _this.FieldMap = new Map(event.data.fieldMap);
                            resolve(_this.Field);
                        };
                    })];
            });
        });
    };
    Chunk.prototype.generateMarchingCubes = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        _this.Worker.postMessage({
                            GridSize: _this.GridSize,
                            ChunkPosition: _this.ChunkPosition,
                            Seed: _this.seed,
                            generatingTerrain: false,
                            worldFieldMap: _this.WorldFieldMap
                        });
                        _this.Worker.onmessage = function (event) {
                            _this.Mesh = new _Mesh__WEBPACK_IMPORTED_MODULE_0__.Mesh();
                            _this.Mesh.setVertices(event.data.meshVertices);
                            _this.Mesh.setNormals(event.data.meshNormals);
                            _this.Mesh.setTypes(event.data.meshTypes);
                            resolve(_this.Mesh);
                        };
                    })];
            });
        });
    };
    Chunk.prototype.getMesh = function () {
        return this.Mesh;
    };
    return Chunk;
}());



/***/ }),

/***/ "./src/map/terrains.ts":
/*!*****************************!*\
  !*** ./src/map/terrains.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Color: () => (/* binding */ Color),
/* harmony export */   Terrains: () => (/* binding */ Terrains)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");

/**
 * Color class
 */
var Color = /** @class */ (function () {
    /**
     * Creates color
     * @param r - Red value (out of 255)
     * @param g - Green value (out of 255)
     * @param b - Blue value (out of 255)
     */
    function Color(r, g, b) {
        if (r < 0 || r > 255)
            throw new Error("Incorrect color value: red is ".concat(r, "; expect a float from 0 to 255"));
        if (g < 0 || g > 255)
            throw new Error("Incorrect color value: green is ".concat(g, "; expect a float from 0 to 255"));
        if (b < 0 || b > 255)
            throw new Error("Incorrect color value: blue is ".concat(b, "; expect a float from 0 to 255"));
        this.r = r;
        this.g = g;
        this.b = b;
    }
    Color.fromHex = function (hex) {
        // Remove the leading '#' if present
        if (hex.startsWith("#")) {
            hex = hex.slice(1);
        }
        // Parse the hex string
        var bigint = parseInt(hex, 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;
        return new Color(r, g, b);
    };
    /**
     * Creates color object from vec3
     * @param vec Each color should be 0-1
     * @returns Color Object
     */
    Color.fromVec3 = function (vec) {
        return new Color(Math.min(255, Math.max(0, Math.floor(vec[0] * 255))), Math.min(255, Math.max(0, Math.floor(vec[1] * 255))), Math.min(255, Math.max(0, Math.floor(vec[2] * 255))));
    };
    Color.prototype.toString = function () {
        return "rgb(".concat(this.r, ", ").concat(this.g, ", ").concat(this.b, ")");
    };
    /**
     * Creates a vec3 from the color values
     * @returns vec3 with color values.
     * @remarks Note that these values are automatically switched to out of 1.
     */
    Color.prototype.createVec3 = function () {
        return gl_matrix__WEBPACK_IMPORTED_MODULE_0__.fromValues(this.r / 255, this.g / 255, this.b / 255);
    };
    Color.prototype.equals = function (other) {
        return this.r === other.r && this.g === other.g && this.b === other.b;
    };
    return Color;
}());

/**
 * The class for calculating the information for all our terrain types
 */
var Terrains = {
    //NOTE: WHEN ADD TERRAINS CHANGE NUM_TERRAINS in glslPath.ts
    0: {
        //Regular ground
        color: new Color(0, 255, 0),
        reflectiveness: 0.2,
        roughness: 0.8,
        type: 1
    },
    1: {
        // Perfect mirror
        color: new Color(0, 0, 255),
        reflectiveness: 0.2,
        roughness: 0.8,
        type: 2
    },
    2: {
        // Glossy surface
        color: new Color(255, 0, 0),
        reflectiveness: 0.2,
        roughness: 0.0,
        type: 3
    },
    3: {
        // Tinted glass
        color: new Color(100, 0, 0), //red tint
        reflectiveness: 0.2,
        roughness: 1.5, //Index of refraction (look up)
        type: 4
    },
    4: {
        // Emissive surface
        color: new Color(255, 0, 0),
        reflectiveness: 0.2,
        roughness: 0.8,
        type: 5
    }
};


/***/ }),

/***/ "./src/modelLoader/3fmreader.ts":
/*!**************************************!*\
  !*** ./src/modelLoader/3fmreader.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   threemfToMesh: () => (/* binding */ threemfToMesh)
/* harmony export */ });
/* harmony import */ var jszip__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jszip */ "./node_modules/jszip/dist/jszip.min.js");
/* harmony import */ var jszip__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jszip__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec2.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var _map_Mesh__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../map/Mesh */ "./src/map/Mesh.ts");
/* harmony import */ var _map_terrains__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../map/terrains */ "./src/map/terrains.ts");
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};




function threemfToMesh(url_1) {
    return __awaiter(this, arguments, void 0, function (url, importMap) {
        var mesh, modelData, i, TriangleVertices, TriangleVerticesNormals, types, j, col, col_1, found, key, terrain, j, col, found, key, terrain;
        if (importMap === void 0) { importMap = null; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mesh = new _map_Mesh__WEBPACK_IMPORTED_MODULE_1__.Mesh();
                    return [4 /*yield*/, load3MF(url)];
                case 1:
                    modelData = _a.sent();
                    //creteMesh
                    for (i = 0; i < modelData.triangles.length; i++) {
                        TriangleVertices = modelData.triangles[i].map(function (vIdx) { return modelData.vertices[vIdx]; });
                        TriangleVerticesNormals = modelData.triangles[i].map(function (vIdx) { return modelData.normals[vIdx]; });
                        types = [0, 0, 0];
                        if (importMap) {
                            for (j = 0; j < 3; j++) {
                                col = _map_terrains__WEBPACK_IMPORTED_MODULE_2__.Color.fromVec3(modelData.colors[modelData.triangles[i][j]]);
                                if (col.toString() in importMap) {
                                    console.log("YAYYY");
                                    types[j] = importMap[col.toString()];
                                }
                                else {
                                    col_1 = _map_terrains__WEBPACK_IMPORTED_MODULE_2__.Color.fromVec3(modelData.colors[modelData.triangles[i][j]]);
                                    found = false;
                                    for (key in _map_terrains__WEBPACK_IMPORTED_MODULE_2__.Terrains) {
                                        terrain = _map_terrains__WEBPACK_IMPORTED_MODULE_2__.Terrains[parseInt(key)];
                                        if (terrain.type == 1 && col_1.equals(terrain.color)) {
                                            //use that color.
                                            types[j] = parseInt(key);
                                            found = true;
                                        }
                                    }
                                    if (!found) {
                                        //make a new terrain type
                                        _map_terrains__WEBPACK_IMPORTED_MODULE_2__.Terrains[Object.keys(_map_terrains__WEBPACK_IMPORTED_MODULE_2__.Terrains).length] = {
                                            color: col_1,
                                            reflectiveness: 0.2,
                                            roughness: 0.8,
                                            type: 1
                                        };
                                        types[j] = Object.keys(_map_terrains__WEBPACK_IMPORTED_MODULE_2__.Terrains).length - 1;
                                    }
                                }
                            }
                        }
                        else {
                            //Make it based on color
                            for (j = 0; j < 3; j++) {
                                col = _map_terrains__WEBPACK_IMPORTED_MODULE_2__.Color.fromVec3(modelData.colors[modelData.triangles[i][j]]);
                                found = false;
                                for (key in _map_terrains__WEBPACK_IMPORTED_MODULE_2__.Terrains) {
                                    terrain = _map_terrains__WEBPACK_IMPORTED_MODULE_2__.Terrains[parseInt(key)];
                                    if (terrain.type == 1 && col.equals(terrain.color)) {
                                        //use that color.
                                        types[j] = parseInt(key);
                                        found = true;
                                    }
                                }
                                if (!found) {
                                    //make a new terrain type
                                    _map_terrains__WEBPACK_IMPORTED_MODULE_2__.Terrains[Object.keys(_map_terrains__WEBPACK_IMPORTED_MODULE_2__.Terrains).length] = {
                                        color: col,
                                        reflectiveness: 0.2,
                                        roughness: 0.8,
                                        type: 1
                                    };
                                    types[j] = Object.keys(_map_terrains__WEBPACK_IMPORTED_MODULE_2__.Terrains).length - 1;
                                }
                            }
                        }
                        mesh.addTriangle(TriangleVertices, TriangleVerticesNormals, types);
                    }
                    return [2 /*return*/, mesh];
            }
        });
    });
}
/**
 * Parses an #RRGGBB or #RRGGBBAA hex color string into a gl-matrix vec3 (0-1 range).
 * Alpha is ignored.
 * @param hex The hex color string (e.g., "#FF0000").
 * @returns A vec3 representing the color.
 */
function parseHexColor(hex) {
    if (hex.startsWith("#")) {
        hex = hex.substring(1);
    }
    var r = parseInt(hex.substring(0, 2), 16) / 255.0;
    var g = parseInt(hex.substring(2, 4), 16) / 255.0;
    var b = parseInt(hex.substring(4, 6), 16) / 255.0;
    return gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues(r, g, b);
}
/**
 * Calculates smooth vertex normals by averaging the face normals of adjacent triangles.
 * @param vertices The array of vertex positions.
 * @param triangles The array of triangle indices.
 * @returns An array of calculated vertex normals.
 */
function calculateNormals(vertices, triangles) {
    var normals = new Array(vertices.length)
        .fill(0)
        .map(function () { return gl_matrix__WEBPACK_IMPORTED_MODULE_3__.create(); });
    for (var _i = 0, triangles_1 = triangles; _i < triangles_1.length; _i++) {
        var triangle = triangles_1[_i];
        var i1 = triangle[0], i2 = triangle[1], i3 = triangle[2];
        var v1 = vertices[i1];
        var v2 = vertices[i2];
        var v3 = vertices[i3];
        var edge1 = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.subtract(gl_matrix__WEBPACK_IMPORTED_MODULE_3__.create(), v2, v1);
        var edge2 = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.subtract(gl_matrix__WEBPACK_IMPORTED_MODULE_3__.create(), v3, v1);
        var faceNormal = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.cross(gl_matrix__WEBPACK_IMPORTED_MODULE_3__.create(), edge1, edge2);
        // No need to normalize here, as longer edges (larger triangles) should have more influence.
        // Add the face normal to each vertex normal
        gl_matrix__WEBPACK_IMPORTED_MODULE_3__.add(normals[i1], normals[i1], faceNormal);
        gl_matrix__WEBPACK_IMPORTED_MODULE_3__.add(normals[i2], normals[i2], faceNormal);
        gl_matrix__WEBPACK_IMPORTED_MODULE_3__.add(normals[i3], normals[i3], faceNormal);
    }
    // Normalize all the vertex normals
    for (var _a = 0, normals_1 = normals; _a < normals_1.length; _a++) {
        var normal = normals_1[_a];
        gl_matrix__WEBPACK_IMPORTED_MODULE_3__.normalize(normal, normal);
    }
    return normals;
}
/**
 * The main parsing orchestrator.
 * It sets up the resource library and then processes the build items.
 */
function parse3MFModel(xmlDoc) {
    var _a;
    // Define the XML Namespaces
    var CORE_NAMESPACE = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02";
    var MATERIAL_NAMESPACE = "http://schemas.microsoft.com/3dmanufacturing/material/2015/02";
    // --- Step 1: Set up scale ---
    var modelNode = xmlDoc.getElementsByTagNameNS(CORE_NAMESPACE, "model")[0];
    var unit = (modelNode === null || modelNode === void 0 ? void 0 : modelNode.getAttribute("unit")) || "millimeter";
    var scale = 1.0;
    if (unit === "meter")
        scale = 1000.0;
    else if (unit === "inch")
        scale = 25.4;
    else if (unit === "centimeter")
        scale = 10.0;
    // --- Step 2: Parse all resources into a library ---
    var resourceLibrary = {
        objects: new Map(),
        colors: new Map()
        // We'll add textures here later
    };
    var defaultColor = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues(0.8, 0.8, 0.8);
    // Parse Color Groups and Base Materials (they function similarly)
    var colorGroups = xmlDoc.getElementsByTagNameNS(MATERIAL_NAMESPACE, "colorgroup");
    for (var _i = 0, _b = Array.from(colorGroups); _i < _b.length; _i++) {
        var group = _b[_i];
        var id = group.getAttribute("id");
        if (!id)
            continue;
        var colors = Array.from(group.getElementsByTagNameNS(MATERIAL_NAMESPACE, "color")).map(function (c) { return parseHexColor(c.getAttribute("color")); });
        resourceLibrary.colors.set(id, colors);
    }
    var baseMaterials = xmlDoc.getElementsByTagNameNS(MATERIAL_NAMESPACE, "basematerials");
    for (var _c = 0, _d = Array.from(baseMaterials); _c < _d.length; _c++) {
        var group = _d[_c];
        var id = group.getAttribute("id");
        if (!id)
            continue;
        var colors = Array.from(group.getElementsByTagNameNS(MATERIAL_NAMESPACE, "base")).map(function (b) { return parseHexColor(b.getAttribute("displaycolor")); });
        resourceLibrary.colors.set(id, colors);
    }
    // Parse all <object> definitions
    var objects = xmlDoc.getElementsByTagNameNS(CORE_NAMESPACE, "object");
    for (var _e = 0, _f = Array.from(objects); _e < _f.length; _e++) {
        var objectNode = _f[_e];
        var objectId = objectNode.getAttribute("id");
        if (!objectId)
            continue;
        // An object can contain EITHER a <mesh> OR <components>
        var meshNode = objectNode.getElementsByTagNameNS(CORE_NAMESPACE, "mesh")[0];
        var componentsNode = objectNode.getElementsByTagNameNS(CORE_NAMESPACE, "components")[0];
        if (meshNode) {
            var vertices = [];
            var triangles = [];
            var verticesNode = meshNode.getElementsByTagNameNS(CORE_NAMESPACE, "vertices")[0];
            for (var _g = 0, _h = Array.from(verticesNode.getElementsByTagNameNS(CORE_NAMESPACE, "vertex")); _g < _h.length; _g++) {
                var v = _h[_g];
                vertices.push(gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues(parseFloat(v.getAttribute("x")) * scale, parseFloat(v.getAttribute("y")) * scale, parseFloat(v.getAttribute("z")) * scale));
            }
            var objectColors = new Array(vertices.length)
                .fill(0)
                .map(function () { return gl_matrix__WEBPACK_IMPORTED_MODULE_3__.clone(defaultColor); });
            var objectUvs = new Array(vertices.length)
                .fill(0)
                .map(function () { return gl_matrix__WEBPACK_IMPORTED_MODULE_4__.create(); }); // Default UVs
            var trianglesNode = meshNode.getElementsByTagNameNS(CORE_NAMESPACE, "triangles")[0];
            for (var _j = 0, _k = Array.from(trianglesNode.getElementsByTagNameNS(CORE_NAMESPACE, "triangle")); _j < _k.length; _j++) {
                var t = _k[_j];
                var v1 = parseInt(t.getAttribute("v1"), 10);
                var v2 = parseInt(t.getAttribute("v2"), 10);
                var v3 = parseInt(t.getAttribute("v3"), 10);
                triangles.push([v1, v2, v3]);
                var pid = t.getAttribute("pid") || objectNode.getAttribute("pid");
                if (pid && resourceLibrary.colors.has(pid)) {
                    var colors = resourceLibrary.colors.get(pid);
                    var p1_str = (_a = t.getAttribute("p1")) !== null && _a !== void 0 ? _a : objectNode.getAttribute("pindex");
                    if (p1_str) {
                        var idx = parseInt(p1_str, 10);
                        if (colors[idx]) {
                            objectColors[v1] = colors[idx];
                            objectColors[v2] = colors[idx]; // v2/v3 default to v1 color if not specified
                            objectColors[v3] = colors[idx];
                        }
                    }
                    var p2_str = t.getAttribute("p2");
                    if (p2_str)
                        objectColors[v2] = colors[parseInt(p2_str, 10)];
                    var p3_str = t.getAttribute("p3");
                    if (p3_str)
                        objectColors[v3] = colors[parseInt(p3_str, 10)];
                }
            }
            resourceLibrary.objects.set(objectId, {
                mesh: {
                    vertices: vertices,
                    triangles: triangles,
                    colors: objectColors,
                    uvs: objectUvs
                }
            });
        }
        else if (componentsNode) {
            var components = [];
            for (var _l = 0, _m = Array.from(componentsNode.getElementsByTagNameNS(CORE_NAMESPACE, "component")); _l < _m.length; _l++) {
                var c = _m[_l];
                var id = c.getAttribute("objectid");
                if (!id)
                    continue;
                components.push({
                    objectId: id,
                    transform: parseTransform(c.getAttribute("transform"))
                });
            }
            resourceLibrary.objects.set(objectId, { components: components });
        }
    }
    // --- Step 3: Process the build items recursively to generate the final geometry ---
    var finalData = {
        vertices: [],
        colors: [],
        uvs: [],
        triangles: []
    };
    var buildItems = xmlDoc.getElementsByTagNameNS(CORE_NAMESPACE, "item");
    for (var _o = 0, _p = Array.from(buildItems); _o < _p.length; _o++) {
        var item = _p[_o];
        var objectId = item.getAttribute("objectid");
        if (!objectId)
            continue;
        var transform = parseTransform(item.getAttribute("transform"));
        processObject(objectId, transform, resourceLibrary, finalData);
    }
    // --- Step 4: Finalize data and calculate normals ---
    var finalTriangles = [];
    for (var i = 0; i < finalData.triangles.length; i += 3) {
        finalTriangles.push([
            finalData.triangles[i],
            finalData.triangles[i + 1],
            finalData.triangles[i + 2]
        ]);
    }
    var normals = calculateNormals(finalData.vertices, finalTriangles);
    return __assign(__assign({}, finalData), { normals: normals, triangles: finalTriangles });
}
/**
 * The new recursive function that processes an object and its children.
 * @param objectId The ID of the object to process from the library.
 * @param cumulativeTransform The transformation matrix accumulated from parent objects.
 * @param library The parsed resource library.
 * @param out The final, flattened geometry data to be populated.
 */
function processObject(objectId, cumulativeTransform, library, out) {
    var _a, _b;
    var objectData = library.objects.get(objectId);
    if (!objectData)
        return;
    // Case 1: The object is a mesh, so we transform and append its geometry.
    if (objectData.mesh) {
        var mesh = objectData.mesh;
        var vertexOffset = out.vertices.length;
        // Apply transform to each vertex and add to the output
        for (var _i = 0, _c = mesh.vertices; _i < _c.length; _i++) {
            var v = _c[_i];
            var transformedVertex = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.create();
            gl_matrix__WEBPACK_IMPORTED_MODULE_3__.transformMat4(transformedVertex, v, cumulativeTransform);
            out.vertices.push(transformedVertex);
        }
        // Add corresponding colors and UVs
        (_a = out.colors).push.apply(_a, mesh.colors);
        (_b = out.uvs).push.apply(_b, mesh.uvs);
        // Add triangle indices, adjusted by the vertex offset
        for (var _d = 0, _e = mesh.triangles; _d < _e.length; _d++) {
            var tri = _e[_d];
            out.triangles.push(tri[0] + vertexOffset, tri[1] + vertexOffset, tri[2] + vertexOffset);
        }
    }
    // Case 2: The object is an assembly of other components. Recurse!
    else if (objectData.components) {
        for (var _f = 0, _g = objectData.components; _f < _g.length; _f++) {
            var component = _g[_f];
            // Each component has its own local transform. We multiply it with the parent's.
            var componentTransform = gl_matrix__WEBPACK_IMPORTED_MODULE_5__.create();
            gl_matrix__WEBPACK_IMPORTED_MODULE_5__.multiply(componentTransform, cumulativeTransform, component.transform);
            // Recursively process the child component with the new transform.
            processObject(component.objectId, componentTransform, library, out);
        }
    }
}
/**
 * The main loader function. Fetches a .3mf file, unzips it, and extracts geometry.
 * @param url The URL of the .3mf file to load.
 * @returns A promise that resolves with the extracted model data.
 */
function load3MF(url) {
    return __awaiter(this, void 0, void 0, function () {
        var response, fileData, zip, modelFile, xmlString, parser, xmlDoc, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, fetch(url)];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch 3MF file: ".concat(response.statusText));
                    }
                    return [4 /*yield*/, response.arrayBuffer()];
                case 2:
                    fileData = _a.sent();
                    return [4 /*yield*/, jszip__WEBPACK_IMPORTED_MODULE_0___default().loadAsync(fileData)];
                case 3:
                    zip = _a.sent();
                    modelFile = zip.file("3D/3dmodel.model");
                    if (!modelFile) {
                        throw new Error("Invalid 3MF file: 3D/3dmodel.model not found.");
                    }
                    return [4 /*yield*/, modelFile.async("string")];
                case 4:
                    xmlString = _a.sent();
                    parser = new DOMParser();
                    xmlDoc = parser.parseFromString(xmlString, "application/xml");
                    // 5. Extract data from the parsed XML
                    return [2 /*return*/, parse3MFModel(xmlDoc)];
                case 5:
                    error_1 = _a.sent();
                    console.error("Error loading or parsing 3MF file:", error_1);
                    throw error_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Parses a 3MF transform string into a gl-matrix mat4.
 * The 3MF spec provides the matrix in row-major order. The gl-matrix `set`
 * function conveniently also takes arguments in row-major order.
 * @param transformString The space-separated string of 12 matrix values.
 * @returns A mat4 representing the transformation.
 */
function parseTransform(transformString) {
    var transform = gl_matrix__WEBPACK_IMPORTED_MODULE_5__.create(); // Start with an identity matrix
    if (!transformString) {
        return transform;
    }
    var parts = transformString.split(" ").map(parseFloat);
    if (parts.length < 12) {
        console.warn("Invalid transform string found:", transformString);
        return transform; // Return identity if transform is malformed
    }
    // The 3MF string is: Rxx Rxy Rxz Ryx Ryy Ryz Rzx Rzy Rzz Tx Ty Tz
    // These correspond to the first 3 rows of a 4x4 matrix.
    // Let's call them p[0] through p[11].
    // The mat4.set function arguments are in row-major order:
    // set(out, m00, m01, m02, m03,  // Row 0
    //          m10, m11, m12, m13,  // Row 1
    //          m20, m21, m22, m23,  // Row 2
    //          m30, m31, m32, m33); // Row 3
    gl_matrix__WEBPACK_IMPORTED_MODULE_5__.set(transform, parts[0], parts[1], parts[2], parts[9], // Row 0: Rxx, Rxy, Rxz, Tx
    parts[3], parts[4], parts[5], parts[10], // Row 1: Ryx, Ryy, Ryz, Ty
    parts[6], parts[7], parts[8], parts[11], // Row 2: Rzx, Rzy, Rzz, Tz
    0, 0, 0, 1 // Row 3
    );
    return transform;
}


/***/ }),

/***/ "./src/modelLoader/objreader.ts":
/*!**************************************!*\
  !*** ./src/modelLoader/objreader.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   loadPLYToMesh: () => (/* binding */ loadPLYToMesh),
/* harmony export */   objSourceToMesh: () => (/* binding */ objSourceToMesh)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var _map_Mesh__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../map/Mesh */ "./src/map/Mesh.ts");
/* harmony import */ var _map_terrains__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../map/terrains */ "./src/map/terrains.ts");



var calculateNormal = function (vertices) {
    var normal = gl_matrix__WEBPACK_IMPORTED_MODULE_2__.create();
    var v1 = gl_matrix__WEBPACK_IMPORTED_MODULE_2__.subtract(gl_matrix__WEBPACK_IMPORTED_MODULE_2__.create(), vertices[1], vertices[0]);
    var v2 = gl_matrix__WEBPACK_IMPORTED_MODULE_2__.subtract(gl_matrix__WEBPACK_IMPORTED_MODULE_2__.create(), vertices[2], vertices[0]);
    gl_matrix__WEBPACK_IMPORTED_MODULE_2__.cross(normal, v1, v2);
    gl_matrix__WEBPACK_IMPORTED_MODULE_2__.normalize(normal, normal);
    return normal;
};
//TODO: .obj comes with built in optimization reusing vertices
var objSourceToMesh = function (objSource) {
    var i = 0;
    var mesh = new _map_Mesh__WEBPACK_IMPORTED_MODULE_0__.Mesh();
    var vertices = [];
    for (var _i = 0, _a = objSource.split(/\r?\n/); _i < _a.length; _i++) {
        var line = _a[_i];
        if (line.trim() === "") {
            continue;
        }
        if (line.startsWith("v")) {
            var _b = line.split(" "), _ = _b[0], x = _b[1], y = _b[2], z = _b[3];
            vertices.push(gl_matrix__WEBPACK_IMPORTED_MODULE_2__.fromValues(parseFloat(x), parseFloat(y), parseFloat(z)));
        }
        else if (line.startsWith("f")) {
            // note: vertix indices start at 1
            var _c = line.split(" "), _ = _c[0], t1 = _c[1], t2 = _c[2], t3 = _c[3];
            var triangle = [
                vertices[parseInt(t1) - 1],
                vertices[parseInt(t2) - 1],
                vertices[parseInt(t3) - 1]
            ];
            var normal = calculateNormal(triangle);
            mesh.addTriangle(triangle, [normal, normal, normal]);
        }
        else {
            throw new Error("Unexpected line start ".concat(line[0], " of ").concat(line, " at line ").concat(i));
        }
        i++;
    }
    return mesh;
};
function loadPLYToMesh(plyString, importMap) {
    if (importMap === void 0) { importMap = null; }
    var lines = plyString.split(/\r?\n/);
    var numVertices = 0;
    var numFaces = 0;
    var headerEnded = false;
    var vertexLines = [];
    var faceLines = [];
    var lineIndex = 0;
    // Parse header
    while (!headerEnded && lineIndex < lines.length) {
        var line = lines[lineIndex].trim();
        if (line.startsWith("element vertex")) {
            numVertices = parseInt(line.split(" ")[2]);
        }
        else if (line.startsWith("element face")) {
            numFaces = parseInt(line.split(" ")[2]);
        }
        else if (line === "end_header") {
            headerEnded = true;
        }
        lineIndex++;
    }
    // Get vertex lines
    vertexLines = lines.slice(lineIndex, lineIndex + numVertices);
    lineIndex += numVertices;
    // Get face lines
    faceLines = lines.slice(lineIndex, lineIndex + numFaces);
    var vertices = [];
    var normals = [];
    var colors = [];
    // Parse vertices (assumes x y z nx ny nz r g b)
    for (var _i = 0, vertexLines_1 = vertexLines; _i < vertexLines_1.length; _i++) {
        var line = vertexLines_1[_i];
        var parts = line.trim().split(/\s+/).map(Number);
        var v = gl_matrix__WEBPACK_IMPORTED_MODULE_2__.fromValues(parts[0], parts[1], parts[2]);
        vertices.push(v);
        // Normal fallback: if normals exist
        if (parts.length >= 6) {
            var n = gl_matrix__WEBPACK_IMPORTED_MODULE_2__.fromValues(parts[3], parts[4], parts[5]);
            normals.push(n);
        }
        else {
            normals.push(gl_matrix__WEBPACK_IMPORTED_MODULE_2__.fromValues(0, 0, 0));
        }
        //Color fallback
        if (parts.length >= 9) {
            var c = new _map_terrains__WEBPACK_IMPORTED_MODULE_1__.Color(Math.abs(parts[6] * 255), Math.abs(parts[7] * 255), Math.abs(parts[8] * 255));
            colors.push(c);
        }
        else {
            colors.push(new _map_terrains__WEBPACK_IMPORTED_MODULE_1__.Color(255, 255, 255));
        }
    }
    var mesh = new _map_Mesh__WEBPACK_IMPORTED_MODULE_0__.Mesh();
    // Parse faces
    for (var _a = 0, faceLines_1 = faceLines; _a < faceLines_1.length; _a++) {
        var line = faceLines_1[_a];
        var parts = line.trim().split(/\s+/).map(Number);
        var vertexCount = parts[0];
        if (vertexCount < 3)
            continue;
        var indices = parts.slice(1, vertexCount + 1);
        // triangulate polygon (assumes convex)
        for (var i = 1; i < vertexCount - 1; i++) {
            var t = [
                vertices[indices[0]],
                vertices[indices[i]],
                vertices[indices[i + 1]]
            ];
            var n = [
                normals[indices[0]],
                normals[indices[i]],
                normals[indices[i + 1]]
            ];
            var types = [0, 0, 0];
            if (importMap) {
                for (var j = 0; j < 3; j++) {
                    var col = colors[indices[j]];
                    if (col.toString() in importMap) {
                        types[j] = importMap[col.toString()];
                    }
                    else {
                        var col_1 = colors[indices[j]];
                        //Check if simple exists
                        var found = false;
                        for (var key in _map_terrains__WEBPACK_IMPORTED_MODULE_1__.Terrains) {
                            var terrain = _map_terrains__WEBPACK_IMPORTED_MODULE_1__.Terrains[parseInt(key)];
                            if (terrain.type == 1 && col_1.equals(terrain.color)) {
                                //use that color.
                                types[j] = parseInt(key);
                                found = true;
                            }
                        }
                        if (!found) {
                            //make a new terrain type
                            _map_terrains__WEBPACK_IMPORTED_MODULE_1__.Terrains[Object.keys(_map_terrains__WEBPACK_IMPORTED_MODULE_1__.Terrains).length] = {
                                color: col_1,
                                reflectiveness: 0.2,
                                roughness: 0.8,
                                type: 1
                            };
                            types[j] = Object.keys(_map_terrains__WEBPACK_IMPORTED_MODULE_1__.Terrains).length - 1;
                        }
                    }
                }
            }
            else {
                //Make it based on color
                for (var j = 0; j < 3; j++) {
                    var col = colors[indices[j]];
                    //Check if simple exists
                    var found = false;
                    for (var key in _map_terrains__WEBPACK_IMPORTED_MODULE_1__.Terrains) {
                        var terrain = _map_terrains__WEBPACK_IMPORTED_MODULE_1__.Terrains[parseInt(key)];
                        if (terrain.type == 1 && col.equals(terrain.color)) {
                            //use that color.
                            types[j] = parseInt(key);
                            found = true;
                        }
                    }
                    if (!found) {
                        //make a new terrain type
                        _map_terrains__WEBPACK_IMPORTED_MODULE_1__.Terrains[Object.keys(_map_terrains__WEBPACK_IMPORTED_MODULE_1__.Terrains).length] = {
                            color: col,
                            reflectiveness: 0.2,
                            roughness: 0.8,
                            type: 1
                        };
                        types[j] = Object.keys(_map_terrains__WEBPACK_IMPORTED_MODULE_1__.Terrains).length - 1;
                    }
                }
            }
            mesh.addTriangle(t, n, types);
        }
    }
    return mesh;
}


/***/ }),

/***/ "./src/render/Camera.ts":
/*!******************************!*\
  !*** ./src/render/Camera.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Camera: () => (/* binding */ Camera)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/common.js");
/* harmony import */ var _GameEngine__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../GameEngine */ "./src/GameEngine.ts");


var Camera = /** @class */ (function () {
    function Camera(position) {
        this.sensitivity = 0.1;
        this.yaw = -90; // Left right rotation in degrees
        this.pitch = 0; // Up down rotation in degrees
        //Computed Dynamically
        this.front = gl_matrix__WEBPACK_IMPORTED_MODULE_1__.fromValues(0, 0, -1);
        this.right = gl_matrix__WEBPACK_IMPORTED_MODULE_1__.fromValues(1, 0, 0);
        this.up = gl_matrix__WEBPACK_IMPORTED_MODULE_1__.fromValues(0, 1, 0);
        this.position = position;
        this.UpdateCameraVectors();
        this.speed = 0.02;
    }
    Object.defineProperty(Camera.prototype, "XPosition", {
        //enables Camera.XPosition instead of Camera.position[0]
        get: function () {
            return this.position[0];
        },
        set: function (value) {
            this.position[0] = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "YPosition", {
        get: function () {
            return this.position[1];
        },
        set: function (value) {
            this.position[1] = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "ZPosition", {
        get: function () {
            return this.position[2];
        },
        set: function (value) {
            this.position[2] = value;
        },
        enumerable: false,
        configurable: true
    });
    Camera.prototype.getPosition = function () {
        return this.position;
    };
    Camera.prototype.getViewMatrix = function () {
        var viewMatrix = gl_matrix__WEBPACK_IMPORTED_MODULE_2__.create();
        var target = gl_matrix__WEBPACK_IMPORTED_MODULE_1__.create();
        gl_matrix__WEBPACK_IMPORTED_MODULE_1__.add(target, this.position, this.front); // Look-at target
        gl_matrix__WEBPACK_IMPORTED_MODULE_2__.lookAt(viewMatrix, this.position, target, this.up);
        return viewMatrix;
    };
    Camera.prototype.calculateProjectionMatrix = function (canvasWidth, canvasHeight) {
        var matViewProj = gl_matrix__WEBPACK_IMPORTED_MODULE_2__.create();
        var matView = this.getViewMatrix();
        var matProj = gl_matrix__WEBPACK_IMPORTED_MODULE_2__.create();
        gl_matrix__WEBPACK_IMPORTED_MODULE_2__.perspective(matProj, 
        /* fovy= */ gl_matrix__WEBPACK_IMPORTED_MODULE_3__.toRadian(90), 
        /* aspectRatio= */ canvasWidth / canvasHeight, 
        /* near, far= */ 0.1, 100.0);
        gl_matrix__WEBPACK_IMPORTED_MODULE_2__.multiply(matViewProj, matProj, matView);
        return matViewProj;
    };
    Camera.prototype.UpdateCameraVectors = function () {
        var front = gl_matrix__WEBPACK_IMPORTED_MODULE_1__.create();
        front[0] =
            Math.cos(_GameEngine__WEBPACK_IMPORTED_MODULE_0__.GameEngine.toRadians(this.yaw)) *
                Math.cos(_GameEngine__WEBPACK_IMPORTED_MODULE_0__.GameEngine.toRadians(this.pitch));
        front[1] = Math.sin(_GameEngine__WEBPACK_IMPORTED_MODULE_0__.GameEngine.toRadians(this.pitch));
        front[2] =
            Math.sin(_GameEngine__WEBPACK_IMPORTED_MODULE_0__.GameEngine.toRadians(this.yaw)) *
                Math.cos(_GameEngine__WEBPACK_IMPORTED_MODULE_0__.GameEngine.toRadians(this.pitch));
        gl_matrix__WEBPACK_IMPORTED_MODULE_1__.normalize(this.front, front); // Normalize to maintain unit length
        gl_matrix__WEBPACK_IMPORTED_MODULE_1__.cross(this.right, this.front, this.up);
        gl_matrix__WEBPACK_IMPORTED_MODULE_1__.normalize(this.right, this.right);
    };
    return Camera;
}());



/***/ }),

/***/ "./src/render/GLRenderer.ts":
/*!**********************************!*\
  !*** ./src/render/GLRenderer.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GLRenderer: () => (/* binding */ GLRenderer)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var _GlUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./GlUtils */ "./src/render/GlUtils.ts");
/* harmony import */ var _glsl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./glsl */ "./src/render/glsl.ts");
/* harmony import */ var _Shader__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Shader */ "./src/render/Shader.ts");
/* harmony import */ var _map_cubes_utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../map/cubes_utils */ "./src/map/cubes_utils.ts");
/* harmony import */ var _map_geometry__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../map/geometry */ "./src/map/geometry.ts");






var GLRenderer = /** @class */ (function () {
    function GLRenderer(gl, canvas, camera, debug, world) {
        this.TerrainTriangleBuffer = null;
        this.CubeBuffer = null;
        this.TerrainMeshSize = 0;
        this.terrainVAO = null;
        this.wireframeCubeVAO = null;
        this.worldObjectVAOs = new Map();
        this.gl = gl;
        this.canvas = canvas;
        this.camera = camera;
        this.debug = debug;
        this.world = world;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL); // Ensures closer objects are drawn in front
        this.WireframeCubeShader = new _Shader__WEBPACK_IMPORTED_MODULE_2__.Shader(gl, _glsl__WEBPACK_IMPORTED_MODULE_1__.CubeVertexShaderCode, _glsl__WEBPACK_IMPORTED_MODULE_1__.CubeFragmentShaderCode);
        this.TerrainMeshShader = new _Shader__WEBPACK_IMPORTED_MODULE_2__.Shader(gl, _glsl__WEBPACK_IMPORTED_MODULE_1__.MeshVertexShaderCode, _glsl__WEBPACK_IMPORTED_MODULE_1__.MeshFragmentShaderCode);
        this.matViewProj = gl_matrix__WEBPACK_IMPORTED_MODULE_5__.create();
    }
    GLRenderer.prototype.GenerateTriangleBuffer = function (triangleMeshes) {
        // These coordinates are in clip space, to see a visualization, go to https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection
        var triangleVertices = [];
        var triangleIndices = [];
        var indexOffset = 0;
        for (var i = 0; i < triangleMeshes.length; i++) {
            var Mesh_1 = triangleMeshes[i];
            var vertexData = (0,_map_cubes_utils__WEBPACK_IMPORTED_MODULE_3__.meshToVerticesAndIndices)(Mesh_1);
            // Add vertices
            triangleVertices = triangleVertices.concat(Array.from(vertexData.vertices));
            // Add indices with offset
            var adjustedIndices = Array.from(vertexData.indices).map(function (index) { return index + indexOffset; });
            triangleIndices = triangleIndices.concat(adjustedIndices);
            // Update offset for next chunk
            indexOffset += vertexData.vertices.length / 9; // 9 components per vertex
        }
        this.TerrainMeshSize = triangleIndices.length;
        this.TerrainTriangleBuffer = _GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.CreateStaticBuffer(this.gl, new Float32Array(triangleVertices), triangleIndices);
        this.CubeBuffer = _GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.CreateStaticBuffer(this.gl, new Float32Array(_map_geometry__WEBPACK_IMPORTED_MODULE_4__.cubeVertices), _map_geometry__WEBPACK_IMPORTED_MODULE_4__.cubeWireframeIndices);
        this.WireframeCubeShader = new _Shader__WEBPACK_IMPORTED_MODULE_2__.Shader(this.gl, _glsl__WEBPACK_IMPORTED_MODULE_1__.CubeVertexShaderCode, _glsl__WEBPACK_IMPORTED_MODULE_1__.CubeFragmentShaderCode);
        this.TerrainMeshShader = new _Shader__WEBPACK_IMPORTED_MODULE_2__.Shader(this.gl, _glsl__WEBPACK_IMPORTED_MODULE_1__.MeshVertexShaderCode, _glsl__WEBPACK_IMPORTED_MODULE_1__.MeshFragmentShaderCode);
        this.matViewProj = gl_matrix__WEBPACK_IMPORTED_MODULE_5__.create();
    };
    GLRenderer.prototype.drawTerrain = function (TransformationMatrix) {
        this.gl.useProgram(this.TerrainMeshShader.Program);
        _GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.updateLights(this.gl, this.TerrainMeshShader.Program, this.world.lights, this.camera);
        this.gl.uniformMatrix4fv(this.TerrainMeshShader.VertexUniforms["MatrixTransform"].location, false, TransformationMatrix);
        this.gl.uniformMatrix4fv(this.TerrainMeshShader.VertexUniforms["matViewProj"].location, false, this.matViewProj);
        //Create vertice array object
        if (!this.TerrainTriangleBuffer) {
            console.error("TriangleBuffer not initialized.");
            return;
        }
        if (!this.terrainVAO) {
            this.terrainVAO = _GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.createInterleavedVao(this.gl, this.TerrainTriangleBuffer.vertex, this.TerrainTriangleBuffer.indices, this.TerrainMeshShader, {
                VertexPosition: {
                    offset: 0,
                    stride: 36,
                    sizeOverride: 3
                },
                VertexNormal: { offset: 12, stride: 36 },
                VertexColor: { offset: 24, stride: 36 }
            });
        }
        this.gl.bindVertexArray(this.terrainVAO);
        this.gl.drawElements(this.gl.TRIANGLES, this.TerrainMeshSize, this.gl.UNSIGNED_INT, 0);
        this.gl.bindVertexArray(null);
    };
    GLRenderer.prototype.DrawWireFrameCube = function (TransformationMatrix) {
        this.gl.useProgram(this.WireframeCubeShader.Program);
        this.gl.uniformMatrix4fv(this.WireframeCubeShader.VertexUniforms["MatrixTransform"].location, false, TransformationMatrix);
        this.gl.uniformMatrix4fv(this.WireframeCubeShader.VertexUniforms["matViewProj"].location, false, this.matViewProj);
        if (!this.CubeBuffer)
            throw new Error("CubeBuffer not initialized.");
        if (!this.wireframeCubeVAO) {
            this.wireframeCubeVAO = _GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.createInterleavedVao(this.gl, this.CubeBuffer.vertex, this.CubeBuffer.indices, this.WireframeCubeShader, {
                VertexPosition: {
                    offset: 0,
                    stride: 24,
                    sizeOverride: 3
                },
                VertexColor: { offset: 12, stride: 24 }
            });
        }
        this.gl.bindVertexArray(this.wireframeCubeVAO);
        this.gl.drawElements(this.gl.LINES, 24, this.gl.UNSIGNED_INT, 0);
        this.gl.bindVertexArray(null);
    };
    GLRenderer.prototype.drawWorldObject = function (obj) {
        // for now, just use the terrain mesh
        this.gl.useProgram(this.TerrainMeshShader.Program);
        this.gl.uniformMatrix4fv(this.TerrainMeshShader.VertexUniforms["MatrixTransform"].location, false, obj.position);
        this.gl.uniformMatrix4fv(this.TerrainMeshShader.VertexUniforms["matViewProj"].location, false, this.matViewProj);
        // TODO: vao should be per mesh, not per object
        // Do we need to have some sort of meshid instead of objectid?
        if (!this.worldObjectVAOs.has(obj.id)) {
            var vao = _GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.createInterleavedVao(this.gl, obj.buffer.vertex, obj.buffer.indices, this.TerrainMeshShader, {
                VertexPosition: {
                    offset: 0,
                    stride: 36,
                    sizeOverride: 3
                },
                VertexNormal: { offset: 12, stride: 36 },
                VertexColor: { offset: 24, stride: 36 }
            });
            this.worldObjectVAOs.set(obj.id, vao);
        }
        this.gl.bindVertexArray(this.worldObjectVAOs.get(obj.id));
        this.gl.drawElements(this.gl.TRIANGLES, obj.meshSize, this.gl.UNSIGNED_INT, 0);
        this.gl.bindVertexArray(null);
    };
    GLRenderer.prototype.render = function () {
        // Set clear color to black, fully opaque
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Clear the color buffer with specified clear color
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        // Calculate view and projection matrices once per frame
        this.matViewProj = this.camera.calculateProjectionMatrix(this.canvas.width, this.canvas.height);
        var resScaleFactor = 1;
        if (this.debug.debugMode) {
            for (var _i = 0, _a = this.world.chunks; _i < _a.length; _i++) {
                var chunk = _a[_i];
                this.DrawWireFrameCube(_GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.CreateTransformations(gl_matrix__WEBPACK_IMPORTED_MODULE_6__.fromValues(chunk.ChunkPosition[0], 0, chunk.ChunkPosition[1]), undefined, gl_matrix__WEBPACK_IMPORTED_MODULE_6__.fromValues(this.world.resolution, this.world.height, this.world.resolution)));
            }
        }
        this.drawTerrain(_GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.CreateTransformations(gl_matrix__WEBPACK_IMPORTED_MODULE_6__.fromValues(0, 0, 0), gl_matrix__WEBPACK_IMPORTED_MODULE_6__.fromValues(0, 0, 0), gl_matrix__WEBPACK_IMPORTED_MODULE_6__.fromValues(resScaleFactor, resScaleFactor, resScaleFactor)));
        for (var _b = 0, _c = this.world.worldObjects; _b < _c.length; _b++) {
            var object = _c[_b];
            this.drawWorldObject(object);
        }
    };
    return GLRenderer;
}());



/***/ }),

/***/ "./src/render/GlUtils.ts":
/*!*******************************!*\
  !*** ./src/render/GlUtils.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GlUtils: () => (/* binding */ GlUtils)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var _map_Mesh__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../map/Mesh */ "./src/map/Mesh.ts");


var GlUtils = /** @class */ (function () {
    function GlUtils() {
    }
    /**
     * Creates a WebGL program with the given vertex and fragment shader code.
     * @param gl The WebGL2RenderingContext to use for creating the program.
     * @param VertexShaderCode The GLSL code for the vertex shader.
     * @param FragmentShaderCode The GLSL code for the fragment shader.
     * @returns The created WebGLProgram or undefined if linking failed.
     * @throws Error if shader compilation fails.
     */
    GlUtils.CreateProgram = function (gl, VertexShaderCode, FragmentShaderCode) {
        var VertexShader = this.CreateShader(gl, gl.VERTEX_SHADER, VertexShaderCode);
        var FragmentShader = this.CreateShader(gl, gl.FRAGMENT_SHADER, FragmentShaderCode);
        var Program = gl.createProgram();
        gl.attachShader(Program, VertexShader);
        gl.attachShader(Program, FragmentShader);
        gl.linkProgram(Program);
        if (!gl.getProgramParameter(Program, gl.LINK_STATUS)) {
            var errorMessage = gl.getProgramInfoLog(Program);
            console.error("Failed to link GPU program: ".concat(errorMessage));
            return;
        }
        return Program;
    };
    /**
     * Creates a WebGL shader of the specified type with the given GLSL code.
     * @param gl The WebGL2RenderingContext to use for creating the shader.
     * @param ShaderType The type of shader to create (e.g., gl.VERTEX_SHADER, gl.FRAGMENT_SHADER).
     * @param ShaderCode The GLSL code for the shader.
     * @returns The created WebGLShader.
     * @throws Error if shader compilation fails.
     */
    GlUtils.CreateShader = function (gl, ShaderType, ShaderCode) {
        var Shader = gl.createShader(ShaderType);
        if (!Shader) {
            throw new Error("Failed to create WebGL shader.");
        }
        gl.shaderSource(Shader, ShaderCode);
        gl.compileShader(Shader);
        if (!gl.getShaderParameter(Shader, gl.COMPILE_STATUS)) {
            console.error("Shader compilation error: ", gl.getShaderInfoLog(Shader));
            gl.deleteShader(Shader); // Clean up the failed shader
            throw new Error("Shader compilation failed.");
        }
        return Shader;
    };
    /**
     * Creates a static buffer for vertices and indices.
     * @param gl The WebGL2RenderingContext to use for creating the buffer.
     * @param CPUVertexBuffer The Float32Array containing vertex data.
     * @param CPUIndexBuffer The array of indices for the buffer.
     * @returns An object containing the vertex buffer and index buffer.
     * @throws Error if buffer creation fails.
     */
    GlUtils.CreateStaticBuffer = function (gl, CPUVertexBuffer, CPUIndexBuffer) {
        var buffer = gl.createBuffer();
        if (!buffer) {
            throw new Error("Failed to create buffer");
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, CPUVertexBuffer, gl.STATIC_DRAW);
        var IndexBuffer = this.CreateIndexBuffer(gl, CPUIndexBuffer);
        return {
            vertex: buffer,
            // color: colorBuffer,
            indices: IndexBuffer
        };
    };
    /**
     * Creates a transformation matrix based on translation, rotation, and scale. Translate, rotate, then scale.
     * @param translation A vec3 representing the translation (x, y, z).
     * @param rotation A vec3 representing the rotation in radians (x, y, z).
     * @param scale A vec3 representing the scale (x, y, z).
     * @returns A mat4 transformation matrix.
     */
    GlUtils.CreateTransformations = function (translation, rotation, scale) {
        var transformMatrix = gl_matrix__WEBPACK_IMPORTED_MODULE_1__.create();
        if (translation) {
            gl_matrix__WEBPACK_IMPORTED_MODULE_1__.translate(transformMatrix, transformMatrix, translation);
        }
        if (rotation) {
            gl_matrix__WEBPACK_IMPORTED_MODULE_1__.rotateX(transformMatrix, transformMatrix, rotation[0]);
            gl_matrix__WEBPACK_IMPORTED_MODULE_1__.rotateY(transformMatrix, transformMatrix, rotation[1]);
            gl_matrix__WEBPACK_IMPORTED_MODULE_1__.rotateZ(transformMatrix, transformMatrix, rotation[2]);
        }
        if (scale) {
            gl_matrix__WEBPACK_IMPORTED_MODULE_1__.scale(transformMatrix, transformMatrix, scale);
        }
        return transformMatrix;
    };
    /**
     * Creates an index buffer for the given indices.
     * @param gl The WebGL2RenderingContext to use for creating the buffer.
     * @param indices The array of indices to be stored in the buffer.
     * @returns The created WebGLBuffer containing the indices.
     */
    GlUtils.CreateIndexBuffer = function (gl, indices) {
        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        // This array defines each face as two triangles, using the
        // indices into the vertex array to specify each triangle's
        // position.
        // Now send the element array to GL
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
        return indexBuffer;
    };
    /**
     * Creates a Vertex Array Object (VAO) for interleaved vertex attributes.
     * @param gl The WebGL2RenderingContext to use for creating the VAO.
     * @param vertexBuffer The WebGLBuffer containing vertex data.
     * @param indexBuffer The WebGLBuffer containing index data.
     * @param shader The Shader object containing vertex attribute locations.
     * @param layout An object defining the layout of vertex attributes.
     * @returns The created VAO.
     */
    GlUtils.createInterleavedVao = function (gl, vertexBuffer, indexBuffer, shader, layout) {
        var _a;
        var vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        for (var _i = 0, _b = Object.entries(shader.VertexInputs); _i < _b.length; _i++) {
            var _c = _b[_i], name_1 = _c[0], attrib = _c[1];
            var layoutInfo = layout[name_1];
            if (!layoutInfo) {
                console.warn("No layout info for attribute ".concat(name_1, ", skipping."));
                continue;
            }
            var size = (_a = layoutInfo.sizeOverride) !== null && _a !== void 0 ? _a : attrib.size;
            gl.enableVertexAttribArray(attrib.location);
            gl.vertexAttribPointer(attrib.location, size, gl.FLOAT, false, layoutInfo.stride, layoutInfo.offset);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vao;
    };
    /**
     * Calculates the necessary vertices, normals, and wireframes for cubes for our world
     * @param world The world we are rendering
     * @returns { List of triangle meshes }
     */
    GlUtils.genTerrainVertices = function (world) {
        var triangleMeshes = []; // Store all chunks' meshes
        var mainMesh = new _map_Mesh__WEBPACK_IMPORTED_MODULE_0__.Mesh();
        for (var _i = 0, _a = world.chunks; _i < _a.length; _i++) {
            var chunk = _a[_i];
            var triangleMesh = chunk.Mesh;
            triangleMesh.translate(gl_matrix__WEBPACK_IMPORTED_MODULE_2__.fromValues(chunk.ChunkPosition[0], 0, chunk.ChunkPosition[1]));
            mainMesh.merge(triangleMesh);
            triangleMeshes.push(triangleMesh); // Store the chunk's mesh
        }
        return triangleMeshes;
    };
    GlUtils.updateLights = function (gl, program, lights, camera) {
        // Set number of active lights
        var numLightsLocation = gl.getUniformLocation(program, "numActiveLights");
        gl.uniform1i(numLightsLocation, lights.length);
        // Update each light's data
        lights.forEach(function (light, index) {
            var baseUniform = "lights[".concat(index, "]");
            var posLocation = gl.getUniformLocation(program, "".concat(baseUniform, ".position"));
            var colorLocation = gl.getUniformLocation(program, "".concat(baseUniform, ".color"));
            var intensityLocation = gl.getUniformLocation(program, "".concat(baseUniform, ".intensity"));
            var radiusLocation = gl.getUniformLocation(program, "".concat(baseUniform, ".radius"));
            var showColorLocation = gl.getUniformLocation(program, "".concat(baseUniform, ".showColor"));
            gl.uniform3fv(posLocation, light.position);
            gl.uniform3fv(colorLocation, light.color.createVec3());
            gl.uniform3fv(showColorLocation, light.showColor.createVec3());
            gl.uniform1f(intensityLocation, light.intensity);
            gl.uniform1f(radiusLocation, light.radius);
        });
        if (camera) {
            var viewPositionLocation = gl.getUniformLocation(program, "viewPosition");
            gl.uniform3fv(viewPositionLocation, camera.getPosition());
        }
    };
    ///////////////////////Texture Utilities/////////////////////
    /**
     * Binds a given WebGL texture to texture unit 0 and sets the corresponding sampler uniform in the shader program.
     *
     * @param gl - The WebGL2RenderingContext to use for binding.
     * @param program - The WebGLProgram to bind the texture to.
     * @param tex - The WebGLTexture to bind.
     * @param key - The name of the sampler uniform in the shader program to associate with the texture.
     * @param unit - The texture unit to bind the texture to (0-15 for WebGL2).
     *
     * @remarks
     * If the specified uniform cannot be found in the shader program, a warning is logged to the console.
     */
    GlUtils.bindTex = function (gl, program, tex, key, unit) {
        var loc = gl.getUniformLocation(program, key);
        if (loc === null) {
            console.warn("Cannot find ".concat(key, " in fragmentShader"));
            return;
        }
        // Bind to the specified texture unit
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // Tell the shader's sampler to use this texture unit
        gl.uniform1i(loc, unit);
    };
    /**
     * Uploads a Float32Array to GPU as a 2D RGBA32F texture.
     * Each texel stores 4 floats (R, G, B, A).
     * (totally not vibecoded)
     * @param gl         - WebGL2RenderingContext
     * @param data       - Float32Array containing your raw float data
     * @param widthHint  - Optional: manual texture width (default auto-calculated)
     * @returns texture: WebGLTexture
     */
    GlUtils.packFloatArrayToTexture = function (gl, data, widthHint) {
        if (data.length % 4 !== 0) {
            console.warn("[packFloatArrayToTexture] Padding input from ".concat(data.length, " to multiple of 4"));
            var padded = new Float32Array(Math.ceil(data.length / 4) * 4);
            padded.set(data);
            data = padded;
        }
        var totalTexels = data.length / 4;
        var width = widthHint || Math.ceil(Math.sqrt(totalTexels));
        var height = Math.ceil(totalTexels / width);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, // Internal format
        width, height, 0, gl.RGBA, // Format of incoming data
        gl.FLOAT, new Float32Array(width * height * 4).fill(0).map(function (_, i) { var _a; return (_a = data[i]) !== null && _a !== void 0 ? _a : 0; }) // Fill/pad if needed
        );
        // NEAREST = no filtering/interpolation
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return texture;
    };
    return GlUtils;
}());



/***/ }),

/***/ "./src/render/Shader.ts":
/*!******************************!*\
  !*** ./src/render/Shader.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Shader: () => (/* binding */ Shader)
/* harmony export */ });
/* harmony import */ var _GlUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./GlUtils */ "./src/render/GlUtils.ts");

var Shader = /** @class */ (function () {
    function Shader(gl, VertexShaderCode, FragmentShaderCode) {
        this.VertexShaderCode = VertexShaderCode;
        this.FragmentShaderCode = FragmentShaderCode;
        this.Program = _GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.CreateProgram(gl, VertexShaderCode, FragmentShaderCode);
        if (!this.Program) {
            throw new Error("Error creating shader program");
        }
        var VertexVariables = this.extractShaderVariables(gl, VertexShaderCode, this.Program);
        this.VertexInputs = VertexVariables[0];
        this.VertexUniforms = VertexVariables[1];
    }
    Shader.prototype.extractShaderVariables = function (gl, shaderCode, program) {
        var inputPattern = /in\s+(\w+)\s+(\w+);/g;
        var uniformPattern = /uniform\s+(\w+)\s+(\w+);/g;
        var inputs = {};
        var uniforms = {};
        var match;
        // Extract inputs
        while ((match = inputPattern.exec(shaderCode)) !== null) {
            var location_1 = gl.getAttribLocation(program, match[2]);
            if (location_1 === -1) {
                console.error("Attribute ".concat(match[2], " not found in shader program."));
                continue;
            }
            inputs[match[2]] = {
                type: match[1],
                size: this.glslTypeToSize(match[1]),
                location: location_1
            };
        }
        // Extract uniforms
        while ((match = uniformPattern.exec(shaderCode)) !== null) {
            var location_2 = gl.getUniformLocation(program, match[2]);
            if (location_2 === null) {
                console.error("Uniform ".concat(match[2], " not found in shader program."));
                continue;
            }
            uniforms[match[2]] = { type: match[1], location: location_2 };
        }
        return [inputs, uniforms];
    };
    // Method to get the size of a GLSL type
    Shader.prototype.glslTypeToSize = function (type) {
        switch (type) {
            case "float":
                return 1;
            case "vec2":
                return 2;
            case "vec3":
                return 3;
            case "vec4":
                return 4;
            default:
                throw new Error("Unsupported GLSL type: ".concat(type));
        }
    };
    return Shader;
}());



/***/ }),

/***/ "./src/render/glsl.ts":
/*!****************************!*\
  !*** ./src/render/glsl.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CubeFragmentShaderCode: () => (/* binding */ CubeFragmentShaderCode),
/* harmony export */   CubeVertexShaderCode: () => (/* binding */ CubeVertexShaderCode),
/* harmony export */   MeshFragmentShaderCode: () => (/* binding */ MeshFragmentShaderCode),
/* harmony export */   MeshVertexShaderCode: () => (/* binding */ MeshVertexShaderCode)
/* harmony export */ });
var CubeVertexShaderCode = /*glsl*/ "#version 300 es\nprecision mediump float;\n//If you see lessons that use attribute, that's an old version of Webgl\nin vec4 VertexPosition;\nin vec3 VertexColor;\nout vec3 fragmentColor;\nuniform mat4 MatrixTransform;\nuniform mat4 matViewProj;\n\nvoid main() {  \n  fragmentColor = VertexColor;\n  gl_Position = matViewProj*MatrixTransform*VertexPosition;\n}\n";
var CubeFragmentShaderCode = /*glsl*/ "#version 300 es\nprecision mediump float;\n\nin vec3 fragmentColor;\nout vec4 outputColor;\n\nvoid main() {\n  outputColor = vec4(fragmentColor, 1);\n}";
//
var MeshVertexShaderCode = /*glsl*/ "#version 300 es\nprecision mediump float;\n//If you see lessons that use attribute, that's an old version of Webgl\nstruct Light {\n  vec3 position;\n  vec3 color;\n  vec3 showColor;\n  float intensity;\n  float radius;\n};\n#define MAX_LIGHTS 100\nuniform Light lights[MAX_LIGHTS];\nin vec4 VertexPosition;\nin vec3 VertexNormal;\nin vec3 VertexColor;\nout vec3 fragmentColor;\nout vec3 fragmentNormal;\nout vec3 fragmentPosition;\nuniform mat4 MatrixTransform;\nuniform mat4 matViewProj;\n\nvoid main() {  \n  fragmentColor = VertexColor;\n  fragmentNormal = VertexNormal;\n  fragmentPosition = VertexPosition.xyz;\n  gl_Position = matViewProj*MatrixTransform*VertexPosition;\n}\n";
var MeshFragmentShaderCode = /*glsl*/ "#version 300 es\nprecision mediump float;\n\nstruct Light {\n  vec3 position;\n  vec3 color;\n  vec3 showColor;\n  float intensity;\n  float radius;\n};\n\n#define MAX_LIGHTS 100\nuniform Light lights[MAX_LIGHTS];\nuniform int numActiveLights;\nuniform vec3 viewPosition;\n\nin vec3 fragmentColor;\nin vec3 fragmentNormal;\nin vec3 fragmentPosition;\nout vec4 outputColor;\n\nvoid main() {\n    vec3 normal = normalize(fragmentNormal);\n    vec3 specular = vec3(0.0);\n    vec3 totalDiffuse = vec3(0.0);\n    \n    float ambientStrength = 0.15;\n    vec3 ambientLight = vec3(0.4, 0.45, 0.5);\n    \n    float metallic = 0.1;\n    float roughness = 0.7;\n    float specularStrength = mix(0.04, 0.9, metallic);\n    int shininess = int(mix(2.0, 32.0, 1.0 - roughness));\n    \n    for(int i = 0; i < MAX_LIGHTS; i++) {\n        if(i >= numActiveLights) break;\n        \n        vec3 lightDir = normalize(lights[i].position - fragmentPosition);\n        float distance = length(lights[i].position - fragmentPosition);\n        \n        \n        // Diffuse lighting\n        float diffuseStrength = max(dot(normal, lightDir), 0.1);\n        vec3 diffuse = diffuseStrength * lights[i].color * lights[i].intensity;\n        totalDiffuse += diffuse;\n        \n        // Specular lighting (Blinn-Phong)\n        vec3 viewDir = normalize(viewPosition - fragmentPosition);\n        vec3 halfwayDir = normalize(lightDir + viewDir);\n        float spec = pow(max(dot(normal, halfwayDir), 0.0), float(shininess));\n        specular += spec * lights[i].color * lights[i].intensity * specularStrength;\n    }\n    \n    // Combine lighting components\n    vec3 ambient = ambientLight * ambientStrength;\n    vec3 lighting = ambient + totalDiffuse + specular;\n    \n    // Apply lighting to material color\n    vec3 finalColor = fragmentColor * lighting;\n    \n    // Gamma correction\n    finalColor = pow(finalColor, vec3(1.0 / 2.2));\n    \n    outputColor = vec4(finalColor, 1.0);\n}";


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			if (cachedModule.error !== undefined) throw cachedModule.error;
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		try {
/******/ 			var execOptions = { id: moduleId, module: module, factory: __webpack_modules__[moduleId], require: __webpack_require__ };
/******/ 			__webpack_require__.i.forEach(function(handler) { handler(execOptions); });
/******/ 			module = execOptions.module;
/******/ 			execOptions.factory.call(module.exports, module, module.exports, execOptions.require);
/******/ 		} catch(e) {
/******/ 			module.error = e;
/******/ 			throw e;
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = __webpack_module_cache__;
/******/ 	
/******/ 	// expose the module execution interceptor
/******/ 	__webpack_require__.i = [];
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".index.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript update chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference all chunks
/******/ 		__webpack_require__.hu = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + "." + __webpack_require__.h() + ".hot-update.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get update manifest filename */
/******/ 	(() => {
/******/ 		__webpack_require__.hmrF = () => ("main." + __webpack_require__.h() + ".hot-update.json");
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/getFullHash */
/******/ 	(() => {
/******/ 		__webpack_require__.h = () => ("f7983c438be1b74563d3")
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "to-do-list:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hot module replacement */
/******/ 	(() => {
/******/ 		var currentModuleData = {};
/******/ 		var installedModules = __webpack_require__.c;
/******/ 		
/******/ 		// module and require creation
/******/ 		var currentChildModule;
/******/ 		var currentParents = [];
/******/ 		
/******/ 		// status
/******/ 		var registeredStatusHandlers = [];
/******/ 		var currentStatus = "idle";
/******/ 		
/******/ 		// while downloading
/******/ 		var blockingPromises = 0;
/******/ 		var blockingPromisesWaiting = [];
/******/ 		
/******/ 		// The update info
/******/ 		var currentUpdateApplyHandlers;
/******/ 		var queuedInvalidatedModules;
/******/ 		
/******/ 		__webpack_require__.hmrD = currentModuleData;
/******/ 		
/******/ 		__webpack_require__.i.push(function (options) {
/******/ 			var module = options.module;
/******/ 			var require = createRequire(options.require, options.id);
/******/ 			module.hot = createModuleHotObject(options.id, module);
/******/ 			module.parents = currentParents;
/******/ 			module.children = [];
/******/ 			currentParents = [];
/******/ 			options.require = require;
/******/ 		});
/******/ 		
/******/ 		__webpack_require__.hmrC = {};
/******/ 		__webpack_require__.hmrI = {};
/******/ 		
/******/ 		function createRequire(require, moduleId) {
/******/ 			var me = installedModules[moduleId];
/******/ 			if (!me) return require;
/******/ 			var fn = function (request) {
/******/ 				if (me.hot.active) {
/******/ 					if (installedModules[request]) {
/******/ 						var parents = installedModules[request].parents;
/******/ 						if (parents.indexOf(moduleId) === -1) {
/******/ 							parents.push(moduleId);
/******/ 						}
/******/ 					} else {
/******/ 						currentParents = [moduleId];
/******/ 						currentChildModule = request;
/******/ 					}
/******/ 					if (me.children.indexOf(request) === -1) {
/******/ 						me.children.push(request);
/******/ 					}
/******/ 				} else {
/******/ 					console.warn(
/******/ 						"[HMR] unexpected require(" +
/******/ 							request +
/******/ 							") from disposed module " +
/******/ 							moduleId
/******/ 					);
/******/ 					currentParents = [];
/******/ 				}
/******/ 				return require(request);
/******/ 			};
/******/ 			var createPropertyDescriptor = function (name) {
/******/ 				return {
/******/ 					configurable: true,
/******/ 					enumerable: true,
/******/ 					get: function () {
/******/ 						return require[name];
/******/ 					},
/******/ 					set: function (value) {
/******/ 						require[name] = value;
/******/ 					}
/******/ 				};
/******/ 			};
/******/ 			for (var name in require) {
/******/ 				if (Object.prototype.hasOwnProperty.call(require, name) && name !== "e") {
/******/ 					Object.defineProperty(fn, name, createPropertyDescriptor(name));
/******/ 				}
/******/ 			}
/******/ 			fn.e = function (chunkId, fetchPriority) {
/******/ 				return trackBlockingPromise(require.e(chunkId, fetchPriority));
/******/ 			};
/******/ 			return fn;
/******/ 		}
/******/ 		
/******/ 		function createModuleHotObject(moduleId, me) {
/******/ 			var _main = currentChildModule !== moduleId;
/******/ 			var hot = {
/******/ 				// private stuff
/******/ 				_acceptedDependencies: {},
/******/ 				_acceptedErrorHandlers: {},
/******/ 				_declinedDependencies: {},
/******/ 				_selfAccepted: false,
/******/ 				_selfDeclined: false,
/******/ 				_selfInvalidated: false,
/******/ 				_disposeHandlers: [],
/******/ 				_main: _main,
/******/ 				_requireSelf: function () {
/******/ 					currentParents = me.parents.slice();
/******/ 					currentChildModule = _main ? undefined : moduleId;
/******/ 					__webpack_require__(moduleId);
/******/ 				},
/******/ 		
/******/ 				// Module API
/******/ 				active: true,
/******/ 				accept: function (dep, callback, errorHandler) {
/******/ 					if (dep === undefined) hot._selfAccepted = true;
/******/ 					else if (typeof dep === "function") hot._selfAccepted = dep;
/******/ 					else if (typeof dep === "object" && dep !== null) {
/******/ 						for (var i = 0; i < dep.length; i++) {
/******/ 							hot._acceptedDependencies[dep[i]] = callback || function () {};
/******/ 							hot._acceptedErrorHandlers[dep[i]] = errorHandler;
/******/ 						}
/******/ 					} else {
/******/ 						hot._acceptedDependencies[dep] = callback || function () {};
/******/ 						hot._acceptedErrorHandlers[dep] = errorHandler;
/******/ 					}
/******/ 				},
/******/ 				decline: function (dep) {
/******/ 					if (dep === undefined) hot._selfDeclined = true;
/******/ 					else if (typeof dep === "object" && dep !== null)
/******/ 						for (var i = 0; i < dep.length; i++)
/******/ 							hot._declinedDependencies[dep[i]] = true;
/******/ 					else hot._declinedDependencies[dep] = true;
/******/ 				},
/******/ 				dispose: function (callback) {
/******/ 					hot._disposeHandlers.push(callback);
/******/ 				},
/******/ 				addDisposeHandler: function (callback) {
/******/ 					hot._disposeHandlers.push(callback);
/******/ 				},
/******/ 				removeDisposeHandler: function (callback) {
/******/ 					var idx = hot._disposeHandlers.indexOf(callback);
/******/ 					if (idx >= 0) hot._disposeHandlers.splice(idx, 1);
/******/ 				},
/******/ 				invalidate: function () {
/******/ 					this._selfInvalidated = true;
/******/ 					switch (currentStatus) {
/******/ 						case "idle":
/******/ 							currentUpdateApplyHandlers = [];
/******/ 							Object.keys(__webpack_require__.hmrI).forEach(function (key) {
/******/ 								__webpack_require__.hmrI[key](
/******/ 									moduleId,
/******/ 									currentUpdateApplyHandlers
/******/ 								);
/******/ 							});
/******/ 							setStatus("ready");
/******/ 							break;
/******/ 						case "ready":
/******/ 							Object.keys(__webpack_require__.hmrI).forEach(function (key) {
/******/ 								__webpack_require__.hmrI[key](
/******/ 									moduleId,
/******/ 									currentUpdateApplyHandlers
/******/ 								);
/******/ 							});
/******/ 							break;
/******/ 						case "prepare":
/******/ 						case "check":
/******/ 						case "dispose":
/******/ 						case "apply":
/******/ 							(queuedInvalidatedModules = queuedInvalidatedModules || []).push(
/******/ 								moduleId
/******/ 							);
/******/ 							break;
/******/ 						default:
/******/ 							// ignore requests in error states
/******/ 							break;
/******/ 					}
/******/ 				},
/******/ 		
/******/ 				// Management API
/******/ 				check: hotCheck,
/******/ 				apply: hotApply,
/******/ 				status: function (l) {
/******/ 					if (!l) return currentStatus;
/******/ 					registeredStatusHandlers.push(l);
/******/ 				},
/******/ 				addStatusHandler: function (l) {
/******/ 					registeredStatusHandlers.push(l);
/******/ 				},
/******/ 				removeStatusHandler: function (l) {
/******/ 					var idx = registeredStatusHandlers.indexOf(l);
/******/ 					if (idx >= 0) registeredStatusHandlers.splice(idx, 1);
/******/ 				},
/******/ 		
/******/ 				// inherit from previous dispose call
/******/ 				data: currentModuleData[moduleId]
/******/ 			};
/******/ 			currentChildModule = undefined;
/******/ 			return hot;
/******/ 		}
/******/ 		
/******/ 		function setStatus(newStatus) {
/******/ 			currentStatus = newStatus;
/******/ 			var results = [];
/******/ 		
/******/ 			for (var i = 0; i < registeredStatusHandlers.length; i++)
/******/ 				results[i] = registeredStatusHandlers[i].call(null, newStatus);
/******/ 		
/******/ 			return Promise.all(results).then(function () {});
/******/ 		}
/******/ 		
/******/ 		function unblock() {
/******/ 			if (--blockingPromises === 0) {
/******/ 				setStatus("ready").then(function () {
/******/ 					if (blockingPromises === 0) {
/******/ 						var list = blockingPromisesWaiting;
/******/ 						blockingPromisesWaiting = [];
/******/ 						for (var i = 0; i < list.length; i++) {
/******/ 							list[i]();
/******/ 						}
/******/ 					}
/******/ 				});
/******/ 			}
/******/ 		}
/******/ 		
/******/ 		function trackBlockingPromise(promise) {
/******/ 			switch (currentStatus) {
/******/ 				case "ready":
/******/ 					setStatus("prepare");
/******/ 				/* fallthrough */
/******/ 				case "prepare":
/******/ 					blockingPromises++;
/******/ 					promise.then(unblock, unblock);
/******/ 					return promise;
/******/ 				default:
/******/ 					return promise;
/******/ 			}
/******/ 		}
/******/ 		
/******/ 		function waitForBlockingPromises(fn) {
/******/ 			if (blockingPromises === 0) return fn();
/******/ 			return new Promise(function (resolve) {
/******/ 				blockingPromisesWaiting.push(function () {
/******/ 					resolve(fn());
/******/ 				});
/******/ 			});
/******/ 		}
/******/ 		
/******/ 		function hotCheck(applyOnUpdate) {
/******/ 			if (currentStatus !== "idle") {
/******/ 				throw new Error("check() is only allowed in idle status");
/******/ 			}
/******/ 			return setStatus("check")
/******/ 				.then(__webpack_require__.hmrM)
/******/ 				.then(function (update) {
/******/ 					if (!update) {
/******/ 						return setStatus(applyInvalidatedModules() ? "ready" : "idle").then(
/******/ 							function () {
/******/ 								return null;
/******/ 							}
/******/ 						);
/******/ 					}
/******/ 		
/******/ 					return setStatus("prepare").then(function () {
/******/ 						var updatedModules = [];
/******/ 						currentUpdateApplyHandlers = [];
/******/ 		
/******/ 						return Promise.all(
/******/ 							Object.keys(__webpack_require__.hmrC).reduce(function (
/******/ 								promises,
/******/ 								key
/******/ 							) {
/******/ 								__webpack_require__.hmrC[key](
/******/ 									update.c,
/******/ 									update.r,
/******/ 									update.m,
/******/ 									promises,
/******/ 									currentUpdateApplyHandlers,
/******/ 									updatedModules
/******/ 								);
/******/ 								return promises;
/******/ 							}, [])
/******/ 						).then(function () {
/******/ 							return waitForBlockingPromises(function () {
/******/ 								if (applyOnUpdate) {
/******/ 									return internalApply(applyOnUpdate);
/******/ 								}
/******/ 								return setStatus("ready").then(function () {
/******/ 									return updatedModules;
/******/ 								});
/******/ 							});
/******/ 						});
/******/ 					});
/******/ 				});
/******/ 		}
/******/ 		
/******/ 		function hotApply(options) {
/******/ 			if (currentStatus !== "ready") {
/******/ 				return Promise.resolve().then(function () {
/******/ 					throw new Error(
/******/ 						"apply() is only allowed in ready status (state: " +
/******/ 							currentStatus +
/******/ 							")"
/******/ 					);
/******/ 				});
/******/ 			}
/******/ 			return internalApply(options);
/******/ 		}
/******/ 		
/******/ 		function internalApply(options) {
/******/ 			options = options || {};
/******/ 		
/******/ 			applyInvalidatedModules();
/******/ 		
/******/ 			var results = currentUpdateApplyHandlers.map(function (handler) {
/******/ 				return handler(options);
/******/ 			});
/******/ 			currentUpdateApplyHandlers = undefined;
/******/ 		
/******/ 			var errors = results
/******/ 				.map(function (r) {
/******/ 					return r.error;
/******/ 				})
/******/ 				.filter(Boolean);
/******/ 		
/******/ 			if (errors.length > 0) {
/******/ 				return setStatus("abort").then(function () {
/******/ 					throw errors[0];
/******/ 				});
/******/ 			}
/******/ 		
/******/ 			// Now in "dispose" phase
/******/ 			var disposePromise = setStatus("dispose");
/******/ 		
/******/ 			results.forEach(function (result) {
/******/ 				if (result.dispose) result.dispose();
/******/ 			});
/******/ 		
/******/ 			// Now in "apply" phase
/******/ 			var applyPromise = setStatus("apply");
/******/ 		
/******/ 			var error;
/******/ 			var reportError = function (err) {
/******/ 				if (!error) error = err;
/******/ 			};
/******/ 		
/******/ 			var outdatedModules = [];
/******/ 			results.forEach(function (result) {
/******/ 				if (result.apply) {
/******/ 					var modules = result.apply(reportError);
/******/ 					if (modules) {
/******/ 						for (var i = 0; i < modules.length; i++) {
/******/ 							outdatedModules.push(modules[i]);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 			});
/******/ 		
/******/ 			return Promise.all([disposePromise, applyPromise]).then(function () {
/******/ 				// handle errors in accept handlers and self accepted module load
/******/ 				if (error) {
/******/ 					return setStatus("fail").then(function () {
/******/ 						throw error;
/******/ 					});
/******/ 				}
/******/ 		
/******/ 				if (queuedInvalidatedModules) {
/******/ 					return internalApply(options).then(function (list) {
/******/ 						outdatedModules.forEach(function (moduleId) {
/******/ 							if (list.indexOf(moduleId) < 0) list.push(moduleId);
/******/ 						});
/******/ 						return list;
/******/ 					});
/******/ 				}
/******/ 		
/******/ 				return setStatus("idle").then(function () {
/******/ 					return outdatedModules;
/******/ 				});
/******/ 			});
/******/ 		}
/******/ 		
/******/ 		function applyInvalidatedModules() {
/******/ 			if (queuedInvalidatedModules) {
/******/ 				if (!currentUpdateApplyHandlers) currentUpdateApplyHandlers = [];
/******/ 				Object.keys(__webpack_require__.hmrI).forEach(function (key) {
/******/ 					queuedInvalidatedModules.forEach(function (moduleId) {
/******/ 						__webpack_require__.hmrI[key](
/******/ 							moduleId,
/******/ 							currentUpdateApplyHandlers
/******/ 						);
/******/ 					});
/******/ 				});
/******/ 				queuedInvalidatedModules = undefined;
/******/ 				return true;
/******/ 			}
/******/ 		}
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		__webpack_require__.p = "/";
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		__webpack_require__.b = document.baseURI || self.location.href;
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = __webpack_require__.hmrS_jsonp = __webpack_require__.hmrS_jsonp || {
/******/ 			"main": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		var currentUpdatedModulesList;
/******/ 		var waitingUpdateResolves = {};
/******/ 		function loadUpdateChunk(chunkId, updatedModulesList) {
/******/ 			currentUpdatedModulesList = updatedModulesList;
/******/ 			return new Promise((resolve, reject) => {
/******/ 				waitingUpdateResolves[chunkId] = resolve;
/******/ 				// start update chunk loading
/******/ 				var url = __webpack_require__.p + __webpack_require__.hu(chunkId);
/******/ 				// create error before stack unwound to get useful stacktrace later
/******/ 				var error = new Error();
/******/ 				var loadingEnded = (event) => {
/******/ 					if(waitingUpdateResolves[chunkId]) {
/******/ 						waitingUpdateResolves[chunkId] = undefined
/******/ 						var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 						var realSrc = event && event.target && event.target.src;
/******/ 						error.message = 'Loading hot update chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 						error.name = 'ChunkLoadError';
/******/ 						error.type = errorType;
/******/ 						error.request = realSrc;
/******/ 						reject(error);
/******/ 					}
/******/ 				};
/******/ 				__webpack_require__.l(url, loadingEnded);
/******/ 			});
/******/ 		}
/******/ 		
/******/ 		self["webpackHotUpdateto_do_list"] = (chunkId, moreModules, runtime) => {
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					currentUpdate[moduleId] = moreModules[moduleId];
/******/ 					if(currentUpdatedModulesList) currentUpdatedModulesList.push(moduleId);
/******/ 				}
/******/ 			}
/******/ 			if(runtime) currentUpdateRuntime.push(runtime);
/******/ 			if(waitingUpdateResolves[chunkId]) {
/******/ 				waitingUpdateResolves[chunkId]();
/******/ 				waitingUpdateResolves[chunkId] = undefined;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var currentUpdateChunks;
/******/ 		var currentUpdate;
/******/ 		var currentUpdateRemovedChunks;
/******/ 		var currentUpdateRuntime;
/******/ 		function applyHandler(options) {
/******/ 			if (__webpack_require__.f) delete __webpack_require__.f.jsonpHmr;
/******/ 			currentUpdateChunks = undefined;
/******/ 			function getAffectedModuleEffects(updateModuleId) {
/******/ 				var outdatedModules = [updateModuleId];
/******/ 				var outdatedDependencies = {};
/******/ 		
/******/ 				var queue = outdatedModules.map(function (id) {
/******/ 					return {
/******/ 						chain: [id],
/******/ 						id: id
/******/ 					};
/******/ 				});
/******/ 				while (queue.length > 0) {
/******/ 					var queueItem = queue.pop();
/******/ 					var moduleId = queueItem.id;
/******/ 					var chain = queueItem.chain;
/******/ 					var module = __webpack_require__.c[moduleId];
/******/ 					if (
/******/ 						!module ||
/******/ 						(module.hot._selfAccepted && !module.hot._selfInvalidated)
/******/ 					)
/******/ 						continue;
/******/ 					if (module.hot._selfDeclined) {
/******/ 						return {
/******/ 							type: "self-declined",
/******/ 							chain: chain,
/******/ 							moduleId: moduleId
/******/ 						};
/******/ 					}
/******/ 					if (module.hot._main) {
/******/ 						return {
/******/ 							type: "unaccepted",
/******/ 							chain: chain,
/******/ 							moduleId: moduleId
/******/ 						};
/******/ 					}
/******/ 					for (var i = 0; i < module.parents.length; i++) {
/******/ 						var parentId = module.parents[i];
/******/ 						var parent = __webpack_require__.c[parentId];
/******/ 						if (!parent) continue;
/******/ 						if (parent.hot._declinedDependencies[moduleId]) {
/******/ 							return {
/******/ 								type: "declined",
/******/ 								chain: chain.concat([parentId]),
/******/ 								moduleId: moduleId,
/******/ 								parentId: parentId
/******/ 							};
/******/ 						}
/******/ 						if (outdatedModules.indexOf(parentId) !== -1) continue;
/******/ 						if (parent.hot._acceptedDependencies[moduleId]) {
/******/ 							if (!outdatedDependencies[parentId])
/******/ 								outdatedDependencies[parentId] = [];
/******/ 							addAllToSet(outdatedDependencies[parentId], [moduleId]);
/******/ 							continue;
/******/ 						}
/******/ 						delete outdatedDependencies[parentId];
/******/ 						outdatedModules.push(parentId);
/******/ 						queue.push({
/******/ 							chain: chain.concat([parentId]),
/******/ 							id: parentId
/******/ 						});
/******/ 					}
/******/ 				}
/******/ 		
/******/ 				return {
/******/ 					type: "accepted",
/******/ 					moduleId: updateModuleId,
/******/ 					outdatedModules: outdatedModules,
/******/ 					outdatedDependencies: outdatedDependencies
/******/ 				};
/******/ 			}
/******/ 		
/******/ 			function addAllToSet(a, b) {
/******/ 				for (var i = 0; i < b.length; i++) {
/******/ 					var item = b[i];
/******/ 					if (a.indexOf(item) === -1) a.push(item);
/******/ 				}
/******/ 			}
/******/ 		
/******/ 			// at begin all updates modules are outdated
/******/ 			// the "outdated" status can propagate to parents if they don't accept the children
/******/ 			var outdatedDependencies = {};
/******/ 			var outdatedModules = [];
/******/ 			var appliedUpdate = {};
/******/ 		
/******/ 			var warnUnexpectedRequire = function warnUnexpectedRequire(module) {
/******/ 				console.warn(
/******/ 					"[HMR] unexpected require(" + module.id + ") to disposed module"
/******/ 				);
/******/ 			};
/******/ 		
/******/ 			for (var moduleId in currentUpdate) {
/******/ 				if (__webpack_require__.o(currentUpdate, moduleId)) {
/******/ 					var newModuleFactory = currentUpdate[moduleId];
/******/ 					/** @type {TODO} */
/******/ 					var result = newModuleFactory
/******/ 						? getAffectedModuleEffects(moduleId)
/******/ 						: {
/******/ 								type: "disposed",
/******/ 								moduleId: moduleId
/******/ 							};
/******/ 					/** @type {Error|false} */
/******/ 					var abortError = false;
/******/ 					var doApply = false;
/******/ 					var doDispose = false;
/******/ 					var chainInfo = "";
/******/ 					if (result.chain) {
/******/ 						chainInfo = "\nUpdate propagation: " + result.chain.join(" -> ");
/******/ 					}
/******/ 					switch (result.type) {
/******/ 						case "self-declined":
/******/ 							if (options.onDeclined) options.onDeclined(result);
/******/ 							if (!options.ignoreDeclined)
/******/ 								abortError = new Error(
/******/ 									"Aborted because of self decline: " +
/******/ 										result.moduleId +
/******/ 										chainInfo
/******/ 								);
/******/ 							break;
/******/ 						case "declined":
/******/ 							if (options.onDeclined) options.onDeclined(result);
/******/ 							if (!options.ignoreDeclined)
/******/ 								abortError = new Error(
/******/ 									"Aborted because of declined dependency: " +
/******/ 										result.moduleId +
/******/ 										" in " +
/******/ 										result.parentId +
/******/ 										chainInfo
/******/ 								);
/******/ 							break;
/******/ 						case "unaccepted":
/******/ 							if (options.onUnaccepted) options.onUnaccepted(result);
/******/ 							if (!options.ignoreUnaccepted)
/******/ 								abortError = new Error(
/******/ 									"Aborted because " + moduleId + " is not accepted" + chainInfo
/******/ 								);
/******/ 							break;
/******/ 						case "accepted":
/******/ 							if (options.onAccepted) options.onAccepted(result);
/******/ 							doApply = true;
/******/ 							break;
/******/ 						case "disposed":
/******/ 							if (options.onDisposed) options.onDisposed(result);
/******/ 							doDispose = true;
/******/ 							break;
/******/ 						default:
/******/ 							throw new Error("Unexception type " + result.type);
/******/ 					}
/******/ 					if (abortError) {
/******/ 						return {
/******/ 							error: abortError
/******/ 						};
/******/ 					}
/******/ 					if (doApply) {
/******/ 						appliedUpdate[moduleId] = newModuleFactory;
/******/ 						addAllToSet(outdatedModules, result.outdatedModules);
/******/ 						for (moduleId in result.outdatedDependencies) {
/******/ 							if (__webpack_require__.o(result.outdatedDependencies, moduleId)) {
/******/ 								if (!outdatedDependencies[moduleId])
/******/ 									outdatedDependencies[moduleId] = [];
/******/ 								addAllToSet(
/******/ 									outdatedDependencies[moduleId],
/******/ 									result.outdatedDependencies[moduleId]
/******/ 								);
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 					if (doDispose) {
/******/ 						addAllToSet(outdatedModules, [result.moduleId]);
/******/ 						appliedUpdate[moduleId] = warnUnexpectedRequire;
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 			currentUpdate = undefined;
/******/ 		
/******/ 			// Store self accepted outdated modules to require them later by the module system
/******/ 			var outdatedSelfAcceptedModules = [];
/******/ 			for (var j = 0; j < outdatedModules.length; j++) {
/******/ 				var outdatedModuleId = outdatedModules[j];
/******/ 				var module = __webpack_require__.c[outdatedModuleId];
/******/ 				if (
/******/ 					module &&
/******/ 					(module.hot._selfAccepted || module.hot._main) &&
/******/ 					// removed self-accepted modules should not be required
/******/ 					appliedUpdate[outdatedModuleId] !== warnUnexpectedRequire &&
/******/ 					// when called invalidate self-accepting is not possible
/******/ 					!module.hot._selfInvalidated
/******/ 				) {
/******/ 					outdatedSelfAcceptedModules.push({
/******/ 						module: outdatedModuleId,
/******/ 						require: module.hot._requireSelf,
/******/ 						errorHandler: module.hot._selfAccepted
/******/ 					});
/******/ 				}
/******/ 			}
/******/ 		
/******/ 			var moduleOutdatedDependencies;
/******/ 		
/******/ 			return {
/******/ 				dispose: function () {
/******/ 					currentUpdateRemovedChunks.forEach(function (chunkId) {
/******/ 						delete installedChunks[chunkId];
/******/ 					});
/******/ 					currentUpdateRemovedChunks = undefined;
/******/ 		
/******/ 					var idx;
/******/ 					var queue = outdatedModules.slice();
/******/ 					while (queue.length > 0) {
/******/ 						var moduleId = queue.pop();
/******/ 						var module = __webpack_require__.c[moduleId];
/******/ 						if (!module) continue;
/******/ 		
/******/ 						var data = {};
/******/ 		
/******/ 						// Call dispose handlers
/******/ 						var disposeHandlers = module.hot._disposeHandlers;
/******/ 						for (j = 0; j < disposeHandlers.length; j++) {
/******/ 							disposeHandlers[j].call(null, data);
/******/ 						}
/******/ 						__webpack_require__.hmrD[moduleId] = data;
/******/ 		
/******/ 						// disable module (this disables requires from this module)
/******/ 						module.hot.active = false;
/******/ 		
/******/ 						// remove module from cache
/******/ 						delete __webpack_require__.c[moduleId];
/******/ 		
/******/ 						// when disposing there is no need to call dispose handler
/******/ 						delete outdatedDependencies[moduleId];
/******/ 		
/******/ 						// remove "parents" references from all children
/******/ 						for (j = 0; j < module.children.length; j++) {
/******/ 							var child = __webpack_require__.c[module.children[j]];
/******/ 							if (!child) continue;
/******/ 							idx = child.parents.indexOf(moduleId);
/******/ 							if (idx >= 0) {
/******/ 								child.parents.splice(idx, 1);
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 		
/******/ 					// remove outdated dependency from module children
/******/ 					var dependency;
/******/ 					for (var outdatedModuleId in outdatedDependencies) {
/******/ 						if (__webpack_require__.o(outdatedDependencies, outdatedModuleId)) {
/******/ 							module = __webpack_require__.c[outdatedModuleId];
/******/ 							if (module) {
/******/ 								moduleOutdatedDependencies =
/******/ 									outdatedDependencies[outdatedModuleId];
/******/ 								for (j = 0; j < moduleOutdatedDependencies.length; j++) {
/******/ 									dependency = moduleOutdatedDependencies[j];
/******/ 									idx = module.children.indexOf(dependency);
/******/ 									if (idx >= 0) module.children.splice(idx, 1);
/******/ 								}
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 				},
/******/ 				apply: function (reportError) {
/******/ 					// insert new code
/******/ 					for (var updateModuleId in appliedUpdate) {
/******/ 						if (__webpack_require__.o(appliedUpdate, updateModuleId)) {
/******/ 							__webpack_require__.m[updateModuleId] = appliedUpdate[updateModuleId];
/******/ 						}
/******/ 					}
/******/ 		
/******/ 					// run new runtime modules
/******/ 					for (var i = 0; i < currentUpdateRuntime.length; i++) {
/******/ 						currentUpdateRuntime[i](__webpack_require__);
/******/ 					}
/******/ 		
/******/ 					// call accept handlers
/******/ 					for (var outdatedModuleId in outdatedDependencies) {
/******/ 						if (__webpack_require__.o(outdatedDependencies, outdatedModuleId)) {
/******/ 							var module = __webpack_require__.c[outdatedModuleId];
/******/ 							if (module) {
/******/ 								moduleOutdatedDependencies =
/******/ 									outdatedDependencies[outdatedModuleId];
/******/ 								var callbacks = [];
/******/ 								var errorHandlers = [];
/******/ 								var dependenciesForCallbacks = [];
/******/ 								for (var j = 0; j < moduleOutdatedDependencies.length; j++) {
/******/ 									var dependency = moduleOutdatedDependencies[j];
/******/ 									var acceptCallback =
/******/ 										module.hot._acceptedDependencies[dependency];
/******/ 									var errorHandler =
/******/ 										module.hot._acceptedErrorHandlers[dependency];
/******/ 									if (acceptCallback) {
/******/ 										if (callbacks.indexOf(acceptCallback) !== -1) continue;
/******/ 										callbacks.push(acceptCallback);
/******/ 										errorHandlers.push(errorHandler);
/******/ 										dependenciesForCallbacks.push(dependency);
/******/ 									}
/******/ 								}
/******/ 								for (var k = 0; k < callbacks.length; k++) {
/******/ 									try {
/******/ 										callbacks[k].call(null, moduleOutdatedDependencies);
/******/ 									} catch (err) {
/******/ 										if (typeof errorHandlers[k] === "function") {
/******/ 											try {
/******/ 												errorHandlers[k](err, {
/******/ 													moduleId: outdatedModuleId,
/******/ 													dependencyId: dependenciesForCallbacks[k]
/******/ 												});
/******/ 											} catch (err2) {
/******/ 												if (options.onErrored) {
/******/ 													options.onErrored({
/******/ 														type: "accept-error-handler-errored",
/******/ 														moduleId: outdatedModuleId,
/******/ 														dependencyId: dependenciesForCallbacks[k],
/******/ 														error: err2,
/******/ 														originalError: err
/******/ 													});
/******/ 												}
/******/ 												if (!options.ignoreErrored) {
/******/ 													reportError(err2);
/******/ 													reportError(err);
/******/ 												}
/******/ 											}
/******/ 										} else {
/******/ 											if (options.onErrored) {
/******/ 												options.onErrored({
/******/ 													type: "accept-errored",
/******/ 													moduleId: outdatedModuleId,
/******/ 													dependencyId: dependenciesForCallbacks[k],
/******/ 													error: err
/******/ 												});
/******/ 											}
/******/ 											if (!options.ignoreErrored) {
/******/ 												reportError(err);
/******/ 											}
/******/ 										}
/******/ 									}
/******/ 								}
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 		
/******/ 					// Load self accepted modules
/******/ 					for (var o = 0; o < outdatedSelfAcceptedModules.length; o++) {
/******/ 						var item = outdatedSelfAcceptedModules[o];
/******/ 						var moduleId = item.module;
/******/ 						try {
/******/ 							item.require(moduleId);
/******/ 						} catch (err) {
/******/ 							if (typeof item.errorHandler === "function") {
/******/ 								try {
/******/ 									item.errorHandler(err, {
/******/ 										moduleId: moduleId,
/******/ 										module: __webpack_require__.c[moduleId]
/******/ 									});
/******/ 								} catch (err1) {
/******/ 									if (options.onErrored) {
/******/ 										options.onErrored({
/******/ 											type: "self-accept-error-handler-errored",
/******/ 											moduleId: moduleId,
/******/ 											error: err1,
/******/ 											originalError: err
/******/ 										});
/******/ 									}
/******/ 									if (!options.ignoreErrored) {
/******/ 										reportError(err1);
/******/ 										reportError(err);
/******/ 									}
/******/ 								}
/******/ 							} else {
/******/ 								if (options.onErrored) {
/******/ 									options.onErrored({
/******/ 										type: "self-accept-errored",
/******/ 										moduleId: moduleId,
/******/ 										error: err
/******/ 									});
/******/ 								}
/******/ 								if (!options.ignoreErrored) {
/******/ 									reportError(err);
/******/ 								}
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 		
/******/ 					return outdatedModules;
/******/ 				}
/******/ 			};
/******/ 		}
/******/ 		__webpack_require__.hmrI.jsonp = function (moduleId, applyHandlers) {
/******/ 			if (!currentUpdate) {
/******/ 				currentUpdate = {};
/******/ 				currentUpdateRuntime = [];
/******/ 				currentUpdateRemovedChunks = [];
/******/ 				applyHandlers.push(applyHandler);
/******/ 			}
/******/ 			if (!__webpack_require__.o(currentUpdate, moduleId)) {
/******/ 				currentUpdate[moduleId] = __webpack_require__.m[moduleId];
/******/ 			}
/******/ 		};
/******/ 		__webpack_require__.hmrC.jsonp = function (
/******/ 			chunkIds,
/******/ 			removedChunks,
/******/ 			removedModules,
/******/ 			promises,
/******/ 			applyHandlers,
/******/ 			updatedModulesList
/******/ 		) {
/******/ 			applyHandlers.push(applyHandler);
/******/ 			currentUpdateChunks = {};
/******/ 			currentUpdateRemovedChunks = removedChunks;
/******/ 			currentUpdate = removedModules.reduce(function (obj, key) {
/******/ 				obj[key] = false;
/******/ 				return obj;
/******/ 			}, {});
/******/ 			currentUpdateRuntime = [];
/******/ 			chunkIds.forEach(function (chunkId) {
/******/ 				if (
/******/ 					__webpack_require__.o(installedChunks, chunkId) &&
/******/ 					installedChunks[chunkId] !== undefined
/******/ 				) {
/******/ 					promises.push(loadUpdateChunk(chunkId, updatedModulesList));
/******/ 					currentUpdateChunks[chunkId] = true;
/******/ 				} else {
/******/ 					currentUpdateChunks[chunkId] = false;
/******/ 				}
/******/ 			});
/******/ 			if (__webpack_require__.f) {
/******/ 				__webpack_require__.f.jsonpHmr = function (chunkId, promises) {
/******/ 					if (
/******/ 						currentUpdateChunks &&
/******/ 						__webpack_require__.o(currentUpdateChunks, chunkId) &&
/******/ 						!currentUpdateChunks[chunkId]
/******/ 					) {
/******/ 						promises.push(loadUpdateChunk(chunkId));
/******/ 						currentUpdateChunks[chunkId] = true;
/******/ 					}
/******/ 				};
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.hmrM = () => {
/******/ 			if (typeof fetch === "undefined") throw new Error("No browser support: need fetch API");
/******/ 			return fetch(__webpack_require__.p + __webpack_require__.hmrF()).then((response) => {
/******/ 				if(response.status === 404) return; // no update available
/******/ 				if(!response.ok) throw new Error("Failed to fetch update manifest " + response.statusText);
/******/ 				return response.json();
/******/ 			});
/******/ 		};
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// no jsonp function
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map