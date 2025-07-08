/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/gl-matrix/esm/common.js":
/*!**********************************************!*\
  !*** ./node_modules/gl-matrix/esm/common.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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

/***/ "./src/DebugMenu.ts":
/*!**************************!*\
  !*** ./src/DebugMenu.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GameEngine: () => (/* binding */ GameEngine)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var _DebugMenu__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DebugMenu */ "./src/DebugMenu.ts");
/* harmony import */ var _map_Map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./map/Map */ "./src/map/Map.ts");
/* harmony import */ var _render_Camera__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./render/Camera */ "./src/render/Camera.ts");
/* harmony import */ var _render_GLRenderer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./render/GLRenderer */ "./src/render/GLRenderer.ts");
/* harmony import */ var _Pathtracing_PathTracer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Pathtracing/PathTracer */ "./src/Pathtracing/PathTracer.ts");
/* harmony import */ var _render_GlUtils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./render/GlUtils */ "./src/render/GlUtils.ts");
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
        //Initialize world
        this.world = new _map_Map__WEBPACK_IMPORTED_MODULE_1__.WorldMap(1000, 64, 1000);
        //Initialize Camera
        this.mainCamera = new _render_Camera__WEBPACK_IMPORTED_MODULE_2__.Camera(gl_matrix__WEBPACK_IMPORTED_MODULE_6__.fromValues(0, 0, 3));
        //Initialize Renderer
        this.renderer = new _render_GLRenderer__WEBPACK_IMPORTED_MODULE_3__.GLRenderer(this.gl, this.canvas, this.mainCamera, this.debug, this.world);
        //Initial pathTracer
        this.pathTracer = new _Pathtracing_PathTracer__WEBPACK_IMPORTED_MODULE_4__.PathTracer(this.canvas, this.gl, this.world, this.mainCamera, this.debug);
        //Events
        this.canvas.addEventListener("mousedown", function () { return _this.requestScreenLock(); });
        this.canvas.addEventListener("mousemove", function (e) {
            return _this.mouseMove(e);
        });
        window.addEventListener("resize", function () { return _this.resizeCanvas(); });
        //Debugging
        this.debug.addElement("FPS", function () { return Math.round(_this.currentFPS); });
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
        return __awaiter(this, arguments, void 0, function (usingWorkerMarchingCubes) {
            var _i, _a, chunk;
            if (usingWorkerMarchingCubes === void 0) { usingWorkerMarchingCubes = true; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all(this.world.chunks.map(function (chunk) { return chunk.generateTerrain(); }))];
                    case 1:
                        _b.sent();
                        this.world.populateFieldMap();
                        if (!!usingWorkerMarchingCubes) return [3 /*break*/, 2];
                        for (_i = 0, _a = this.world.chunks; _i < _a.length; _i++) {
                            chunk = _a[_i];
                            chunk.CreateMarchingCubes();
                        }
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, Promise.all(this.world.chunks.map(function (chunk) { return chunk.generateMarchingCubes(); }))];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        this.renderer.GenerateTriangleBuffer(_render_GlUtils__WEBPACK_IMPORTED_MODULE_5__.GlUtils.genTerrainVertices(this.world));
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
        var movement = gl_matrix__WEBPACK_IMPORTED_MODULE_6__.create();
        var oldCamPos = gl_matrix__WEBPACK_IMPORTED_MODULE_6__.create();
        gl_matrix__WEBPACK_IMPORTED_MODULE_6__.copy(oldCamPos, this.mainCamera.position);
        //scaleAndAdd simply adds the second operand by a scaler. Basically just +=camera.front*velocity
        if (this.keys["KeyW"])
            gl_matrix__WEBPACK_IMPORTED_MODULE_6__.scaleAndAdd(movement, movement, this.mainCamera.front, velocity); // Forward
        if (this.keys["KeyS"])
            gl_matrix__WEBPACK_IMPORTED_MODULE_6__.scaleAndAdd(movement, movement, this.mainCamera.front, -velocity); // Backward
        if (this.keys["KeyA"])
            gl_matrix__WEBPACK_IMPORTED_MODULE_6__.scaleAndAdd(movement, movement, this.mainCamera.right, -velocity); // Left
        if (this.keys["KeyD"])
            gl_matrix__WEBPACK_IMPORTED_MODULE_6__.scaleAndAdd(movement, movement, this.mainCamera.right, velocity); // Right
        if (this.keys["Space"])
            gl_matrix__WEBPACK_IMPORTED_MODULE_6__.scaleAndAdd(movement, movement, this.mainCamera.up, velocity); // Up
        if (this.keys["ShiftLeft"])
            gl_matrix__WEBPACK_IMPORTED_MODULE_6__.scaleAndAdd(movement, movement, this.mainCamera.up, -velocity); // Down
        gl_matrix__WEBPACK_IMPORTED_MODULE_6__.add(this.mainCamera.position, this.mainCamera.position, movement);
        if (!gl_matrix__WEBPACK_IMPORTED_MODULE_6__.equals(this.mainCamera.position, oldCamPos)) {
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
        console.log(BVHtree);
        console.log(flatBVHtree);
        ////////////// Pack everything float format to send to glsl
        //Pack triangles
        var _a = _map_BVHUtils__WEBPACK_IMPORTED_MODULE_4__.BVHUtils.packTriangles(mainMesh.mesh, mainMesh.type, mainMesh.normals), vertices = _a.vertices, terrains = _a.terrains, normals = _a.normals;
        console.log(vertices);
        console.log(terrains);
        //Pack BVH
        var _b = _map_BVHUtils__WEBPACK_IMPORTED_MODULE_4__.BVHUtils.packBVH(flatBVHtree), boundingBoxes = _b.boundingBoxes, nodes = _b.nodes, leafs = _b.leafs;
        console.log(boundingBoxes);
        console.log(nodes);
        console.log(leafs);
        //Pack terrain Types
        var terrainTypes = _map_BVHUtils__WEBPACK_IMPORTED_MODULE_4__.BVHUtils.packTerrainTypes();
        console.log(terrainTypes);
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

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   pathTracingFragmentShaderCode: () => (/* binding */ pathTracingFragmentShaderCode),
/* harmony export */   pathTracingVertexShaderCode: () => (/* binding */ pathTracingVertexShaderCode)
/* harmony export */ });
var pathTracingVertexShaderCode = /* glsl */ "#version 300 es\nprecision highp float;\n\nlayout(location = 0) in vec2 a_position;\nout vec2 v_uv;\n\nvoid main() {\n    v_uv = a_position * 0.5 + 0.5; // map [-1, 1] \u2192 [0, 1]\n    gl_Position = vec4(a_position, 0.0, 1.0);\n}\n";
var pathTracingFragmentShaderCode = /* glsl */ "#version 300 es\nprecision highp float;\n\n#define MAX_LIGHTS 30\n#define PI 3.1415926\n\n//Note: \nuniform sampler2D u_lastFrame;\nuniform float u_frameNumber;\nuniform int numBounces;\n\n\nuniform sampler2D u_vertices;\nuniform sampler2D u_terrains;\nuniform sampler2D u_normals;\nuniform sampler2D u_boundingBox;\nuniform sampler2D u_nodesTex;\nuniform sampler2D u_leafsTex;\nuniform sampler2D u_terrainTypes;\nuniform vec3 u_cameraPos;\nuniform mat4 u_invViewProjMatrix;\nuniform vec2 u_resolution;\n\nstruct Light {\n    vec3 position;\n    vec3 color;\n    vec3 showColor;\n    float intensity;\n    float radius;\n};\nuniform Light lights[MAX_LIGHTS];\nuniform int numActiveLights;\n\nin vec2 v_uv;\nout vec4 fragColor;\n\nstruct BVH{\n    vec3 min;\n    vec3 max;\n    int right;\n    int left;\n    int[4] triangles;\n};\n\nstruct Triangle{\n    vec3[3] vertices; \n    int[3] types;\n    vec3 min;\n    vec3 max;\n    vec3 center;\n    vec3 triNormal;\n    vec3[3] normals;\n};\n\nstruct TerrainType{\n    vec3 color;\n    float reflectiveness; // Decimal 0-1   \n    float roughness; // Decimal 0-1\n    int type; //Type. See terrains.ts\n};\n\n#define NUM_TERRAINS 5\nTerrainType[NUM_TERRAINS] Terrains;\n\n// Provides a high quality 32-bit hash function to generate pseudo-random numbers\n// Source: https://www.shadertoy.com/view/4djSRW by Dave Hoskins\nuint hash(uint state) {\n    state ^= 2747636419u;\n    state *= 2654435769u;\n    state ^= state >> 16;\n    state *= 2654435769u;\n    state ^= state >> 16;\n    state *= 2654435769u;\n    return state;\n}\n\n// Generates a random float in the [0, 1] range\nfloat rand(inout uint state) {\n    state = hash(state);\n    return float(state) / 4294967295.0; // 2^32 - 1\n}\n\nfloat fetchFloatFrom1D(sampler2D tex, int index) {\n    ivec2 size = textureSize(tex, 0);\n    int texWidth = size.x;\n    \n    int texelIndex = index / 4;      // Which texel (pixel) contains our float\n    int componentIndex = index % 4;  // Which component (r,g,b,a) of the texel\n\n    // Calculate 2D coordinates of the texel\n    int y_coord = texelIndex / texWidth;\n    int x_coord = texelIndex % texWidth;\n\n    // Convert to UV coordinates [0, 1] for sampling\n    // Add 0.5 to sample the center of the texel\n    float u = (float(x_coord) + 0.5) / float(texWidth);\n    float v = (float(y_coord) + 0.5) / float(size.y);\n\n    vec4 texel = texture(tex, vec2(u, v));\n\n    if (componentIndex == 0) return texel.r;\n    else if (componentIndex == 1) return texel.g;\n    else if (componentIndex == 2) return texel.b;\n    else return texel.a;\n}\n\nBVH getBVH(int i){\n    BVH r;\n    int bbBoxSize = 6;\n    r.min = vec3(fetchFloatFrom1D(u_boundingBox, i*bbBoxSize),fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+1),fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+2));\n    r.max = vec3(fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+3),fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+4),fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+5));\n\n    int nodeSize = 2;\n    r.left = int(fetchFloatFrom1D(u_nodesTex,i*nodeSize));\n    r.right = int(fetchFloatFrom1D(u_nodesTex,i*nodeSize+1));\n\n    int leafSize = 4;\n    r.triangles[0]=int(fetchFloatFrom1D(u_leafsTex,i*leafSize));\n    r.triangles[1]=int(fetchFloatFrom1D(u_leafsTex,i*leafSize+1));\n    r.triangles[2]=int(fetchFloatFrom1D(u_leafsTex,i*leafSize+2));\n    r.triangles[3]=int(fetchFloatFrom1D(u_leafsTex,i*leafSize+3));\n    \n    return r;\n}\n\nTriangle getTriangle(int i){\n    Triangle tri;\n    int triVertexSize = 9;\n    tri.vertices[0] = vec3(fetchFloatFrom1D(u_vertices, i*triVertexSize), fetchFloatFrom1D(u_vertices, i*triVertexSize+1), fetchFloatFrom1D(u_vertices, i*triVertexSize+2));\n    tri.vertices[1] = vec3(fetchFloatFrom1D(u_vertices, i*triVertexSize+3), fetchFloatFrom1D(u_vertices, i*triVertexSize+4), fetchFloatFrom1D(u_vertices, i*triVertexSize+5));\n    tri.vertices[2] = vec3(fetchFloatFrom1D(u_vertices, i*triVertexSize+6), fetchFloatFrom1D(u_vertices, i*triVertexSize+7), fetchFloatFrom1D(u_vertices, i*triVertexSize+8));\n\n    int typeSize = 3;\n    tri.types[0] = int(fetchFloatFrom1D(u_terrains, i*typeSize));\n    tri.types[1] = int(fetchFloatFrom1D(u_terrains, i*typeSize+1));\n    tri.types[2] = int(fetchFloatFrom1D(u_terrains, i*typeSize+2));\n\n    tri.min = vec3(min(tri.vertices[0].x, min(tri.vertices[1].x, tri.vertices[2].x)),\n                   min(tri.vertices[0].y, min(tri.vertices[1].y, tri.vertices[2].y)),\n                   min(tri.vertices[0].z, min(tri.vertices[1].z, tri.vertices[2].z)));\n    tri.max = vec3(max(tri.vertices[0].x, max(tri.vertices[1].x, tri.vertices[2].x)),\n                   max(tri.vertices[0].y, max(tri.vertices[1].y, tri.vertices[2].y)),\n                   max(tri.vertices[0].z, max(tri.vertices[1].z, tri.vertices[2].z)));\n    tri.center = (tri.min + tri.max) * 0.5;\n    tri.triNormal = normalize(cross(tri.vertices[1] - tri.vertices[0], tri.vertices[2] - tri.vertices[0]));\n\n    tri.normals[0] = vec3(fetchFloatFrom1D(u_normals, i*triVertexSize), fetchFloatFrom1D(u_normals, i*triVertexSize+1), fetchFloatFrom1D(u_normals, i*triVertexSize+2));\n    tri.normals[1] = vec3(fetchFloatFrom1D(u_normals, i*triVertexSize+3), fetchFloatFrom1D(u_normals, i*triVertexSize+4), fetchFloatFrom1D(u_normals, i*triVertexSize+5));\n    tri.normals[2] = vec3(fetchFloatFrom1D(u_normals, i*triVertexSize+6), fetchFloatFrom1D(u_normals, i*triVertexSize+7), fetchFloatFrom1D(u_normals, i*triVertexSize+8));\n\n    return tri;\n}\n\nTerrainType getTerrainType(int i){\n    TerrainType t;\n    int terrainTypeSize = 6;\n    t.color = vec3(fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize), fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+1), fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+2));\n    t.reflectiveness = fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+3); \n    t.roughness = fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+4); \n    t.type = int(fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+5));\n\n    return t;\n}\n\nbool intersectAABB(vec3 rayOrigin, vec3 rayDir, vec3 boxMin, vec3 boxMax, out float tMin, out float tMax) {\n    vec3 invDir = 1.0 / rayDir;\n    vec3 t0s = (boxMin - rayOrigin) * invDir;\n    vec3 t1s = (boxMax - rayOrigin) * invDir;\n\n    vec3 tSmalls = min(t0s, t1s);\n    vec3 tBigs = max(t0s, t1s);\n\n    tMin = max(max(tSmalls.x, tSmalls.y), tSmalls.z);\n    tMax = min(min(tBigs.x, tBigs.y), tBigs.z);\n\n    return tMax >= max(tMin, 0.0);\n}\n\n//AI written; Returns distance to intersection with triangle\nfloat intersectTriangle(vec3 rayOrigin, vec3 rayDir, Triangle tri, out vec3 barycentric) {\n    const float EPSILON = 0.000001;\n    vec3 v0 = tri.vertices[0];\n    vec3 v1 = tri.vertices[1];\n    vec3 v2 = tri.vertices[2];\n    vec3 edge1 = v1 - v0;\n    vec3 edge2 = v2 - v0;\n\n    vec3 h = cross(rayDir, edge2);\n    float a = dot(edge1, h);\n\n    if (a > -EPSILON && a < EPSILON) {\n        return -1.0; // Ray is parallel to the triangle\n    }\n\n    float f = 1.0 / a;\n    vec3 s = rayOrigin - v0;\n    float u = f * dot(s, h);\n\n    if (u < 0.0 || u > 1.0) {\n        return -1.0;\n    }\n\n    vec3 q = cross(s, edge1);\n    float v = f * dot(rayDir, q);\n\n    if (v < 0.0 || u + v > 1.0) {\n        return -1.0;\n    }\n\n    // At this stage we can compute t to find out where the intersection point is on the line.\n    float t = f * dot(edge2, q);\n    if (t > EPSILON) { // ray intersection\n        barycentric = vec3(1.0 - u - v, u, v);\n        return t;\n    }\n    \n    return -1.0; // This means that there is a line intersection but not a ray intersection.\n}\n\n//AI written; Returns distance to intersection with light sphere\nfloat intersectLight(vec3 rayOrigin, vec3 rayDir, Light light, out vec3 hitNormal) {\n    vec3 oc = rayOrigin - light.position; \n\n    // The coefficients of the quadratic equation (at^2 + bt + c = 0)\n    float a = dot(rayDir, rayDir); // Should be 1.0 for a normalized rayDir\n    float b = 2.0 * dot(oc, rayDir);\n    float c = dot(oc, oc) - light.radius * light.radius;\n\n    float discriminant = b*b - 4.0*a*c;\n\n    // If the discriminant is negative, the ray misses the sphere.\n    if (discriminant < 0.0) {\n        return -1.0;\n    }\n\n    float sqrt_d = sqrt(discriminant);\n\n    // Calculate the two potential intersection distances (solutions for t)\n    float t0 = (-b - sqrt_d) / (2.0 * a);\n    float t1 = (-b + sqrt_d) / (2.0 * a);\n\n    // We need the smallest, positive t value.\n    // Check the closer intersection point (t0) first.\n    if (t0 > 0.001) { // Use a small epsilon to avoid self-intersection artifacts\n        vec3 hitPoint = rayOrigin + t0 * rayDir;\n        hitNormal = normalize(hitPoint - light.position);\n        return t0;\n    }\n    // If t0 was behind the ray, check the farther intersection point (t1).\n    // This case occurs if the ray starts inside the sphere.\n    else if (t1 > 0.001) {\n        vec3 hitPoint = rayOrigin + t1 * rayDir;\n        hitNormal = normalize(hitPoint - light.position);\n        return t1;\n    }\n\n    // Both intersection points are behind the ray's origin.\n    return -1.0;\n}\n\n/**\n * Returns TRIANGLE index\n */\nint traverseBVH(vec3 rayOrigin, vec3 rayDir, int BVHindex, out vec3 closestBarycentric, out float minHitDistance) {\n    int closestHitIndex = -1;\n    minHitDistance = 1.0/0.0; // Infinity\n\n    int stack[64]; // Stack of 64 - May need to change for larger BVH later\n    int stackPtr = 0;\n    stack[stackPtr++] = 0; // Push root node index\n\n    while (stackPtr > 0) {\n        int nodeIndex = stack[--stackPtr];\n        BVH node = getBVH(nodeIndex);\n\n        float tMin, tMax;\n        if (!intersectAABB(rayOrigin, rayDir, node.min, node.max, tMin, tMax)) {\n            continue;\n        }\n\n        if (tMin >= minHitDistance) {\n            continue;\n        }\n\n        if (node.left == -1) { // Leaf Node\n            for (int j = 0; j < 4; j++) {\n                int triIdx = node.triangles[j];\n                if (triIdx == -1) continue;\n\n                Triangle tri = getTriangle(triIdx);\n                vec3 currentBarycentric;\n                float hitDist = intersectTriangle(rayOrigin, rayDir, tri, currentBarycentric);\n\n                if (hitDist > 0.0 && hitDist < minHitDistance) {\n                    minHitDistance = hitDist;\n                    closestHitIndex = triIdx;\n                    closestBarycentric = currentBarycentric;\n                }\n            }\n        } else { // Internal Node\n            // Check for space for two children to prevent stack overflow\n            if (stackPtr < 63) { \n                stack[stackPtr++] = node.left;\n                stack[stackPtr++] = node.right;\n            }\n        }\n    }\n\n    return closestHitIndex;\n}\n\nvec3 smoothItem(vec3[3] a, vec3 baryCentric){\n    return (\n        baryCentric.x * a[0] + \n        baryCentric.y * a[1] +\n        baryCentric.z * a[2]\n    );\n}\nfloat smoothItem(float[3] a, vec3 baryCentric){\n    return(\n        baryCentric.x * a[0] + \n        baryCentric.y * a[1] +\n        baryCentric.z * a[2]\n    );\n}\n\nvoid getInfo(Triangle tri, vec3 baryCentric, out vec3 smoothNormal, out vec3 matColor, out float matRoughness, out float reflectiveness){\n    TerrainType t1 = Terrains[tri.types[0]];\n    TerrainType t2 = Terrains[tri.types[1]];\n    TerrainType t3 = Terrains[tri.types[2]];\n    vec3[3] colors = vec3[3](\n        t1.color,\n        t2.color,\n        t3.color\n    );\n    float[3] reflectivities = float[3](\n        t1.reflectiveness,\n        t2.reflectiveness,\n        t3.reflectiveness\n    );\n    float[3] roughness = float[3](\n        t1.roughness,\n        t2.roughness,\n        t3.roughness\n    );\n\n    smoothNormal = normalize(smoothItem(tri.normals,baryCentric));\n    matColor = smoothItem(colors,baryCentric);\n    matRoughness = smoothItem(roughness,baryCentric);\n    reflectiveness = smoothItem(reflectivities,baryCentric);\n}\n\n/**\nReturn random direction based on given via cosine\n*/\nvec3 weightedDIR(vec3 normal, inout uint rng_state){\n    float r1 = rand(rng_state);\n    float r2 = rand(rng_state);\n\n    float phi = 2.0 * PI * r1;\n    float cos_theta = sqrt(1.0 - r2);\n    float sin_theta = sqrt(r2);\n    vec3 randomDirHemi = vec3(cos(phi) * sin_theta, sin(phi) * sin_theta, cos_theta);\n    vec3 up = abs(normal.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);\n    vec3 tangent = normalize(cross(up, normal));\n    vec3 bitangent = cross(normal, tangent);\n    vec3 dirWorld = tangent * randomDirHemi.x + bitangent * randomDirHemi.y + normal * randomDirHemi.z;\n    return normalize(dirWorld);\n}\n\nvec3 sampleGlossyDirection(vec3 perfectDir, float roughness, inout uint rng_state) {\n    float r1 = rand(rng_state);\n    float r2 = rand(rng_state);\n\n    float shininess = pow(1.0 - roughness, 3.0) * 1000.0; // adjust as needed\n\n    float phi = 2.0 * PI * r1;\n    float cosTheta = pow(r2, 1.0 / (shininess + 1.0));\n    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);\n\n    vec3 localDir = vec3(\n        cos(phi) * sinTheta,\n        sin(phi) * sinTheta,\n        cosTheta\n    );\n\n    // Construct tangent space around the perfect reflection direction\n    vec3 up = abs(perfectDir.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);\n    vec3 tangent = normalize(cross(up, perfectDir));\n    vec3 bitangent = cross(perfectDir, tangent);\n\n    vec3 worldDir = normalize(\n        tangent * localDir.x + bitangent * localDir.y + perfectDir * localDir.z\n    );\n\n    return worldDir;\n}\n\nbool isValidVec3(vec3 v) {\n    return all(greaterThanEqual(v, vec3(-1e20))) &&\n           all(lessThanEqual(v, vec3(1e20))) &&\n           !any(isnan(v));\n}\n\nvec3 PathTrace(vec3 OGrayOrigin, vec3 OGrayDir, inout uint rng_state) {\n    vec3 rayOrigin = OGrayOrigin;\n    vec3 rayDir = OGrayDir;\n\n    vec3 color = vec3(0.0);\n    vec3 throughput = vec3(1.0);\n\n    int hasMirror = -2;\n    for (int bounce = 0; bounce < numBounces; bounce++) {\n        vec3 baryCentric;\n        float minHitDistance;\n        \n        int triIndex = traverseBVH(rayOrigin, rayDir, 0, baryCentric, minHitDistance);\n        \n        int hitLightIndex = -1;\n        for (int i = 0; i < numActiveLights; i++) {\n            vec3 lightHitNormal;\n            float lightHitDistance = intersectLight(rayOrigin, rayDir, lights[i], lightHitNormal);\n            if (lightHitDistance > 0.0 && lightHitDistance < minHitDistance) {\n                hitLightIndex = i;\n                minHitDistance = lightHitDistance;\n            }\n        }\n\n        if (hitLightIndex != -1) {\n            // Ray hit light source\n            if(bounce != 0){\n                color += throughput * lights[hitLightIndex].color * lights[hitLightIndex].intensity;\n            }else{\n                color = lights[hitLightIndex].showColor;\n            }\n            \n            break; // Path terminates.\n        }\n\n        if (triIndex == -1) {\n            // Ray missed everything and flew into space.\n            if(bounce == 0 || bounce == hasMirror + 1){\n                color = throughput * vec3(0.54,0.824,0.94);\n            }else{\n                color += throughput * 0.00001; // light sky!\n            }\n            break;\n        }\n\n        // The ray hit a triangle \n        //Get information\n        vec3 hitPoint = rayOrigin + rayDir * minHitDistance;\n        Triangle tri = getTriangle(triIndex);\n\n        vec3 smoothNormal, matColor;\n        float matRoughness, reflectiveness;\n        int type = 2;\n        type = Terrains[tri.types[0]].type;\n        getInfo(tri, baryCentric, smoothNormal, matColor, matRoughness, reflectiveness);\n        \n\n        vec3 geometricNormal = tri.triNormal;\n        bool didSwitch = false;\n        if (dot(geometricNormal, rayDir) > 0.0) geometricNormal = -geometricNormal;\n        if (dot(smoothNormal, geometricNormal) < 0.0) {\n            smoothNormal = -smoothNormal;\n            didSwitch = true;\n        }\n\n        vec3 BRDF = matColor / PI;\n        \n        //in the future consider NEE (Next Event Estimation) - Was removed cause buggy\n\n\n        // INDIRECT LIGHTING (Prepare for the NEXT bounce)\n        // Create the next bounce ray\n        if(type != 4) //Transmission goes through\n            rayOrigin = hitPoint + geometricNormal * 0.01;\n        if(type == 1){ //Diffuse\n            rayDir = weightedDIR(smoothNormal, rng_state);\n            throughput *= matColor;\n        }else if (type == 2) { // Specular (mirror)\n            rayDir = normalize(reflect(rayDir, smoothNormal)); // Use built-in\n            throughput *= vec3(0.8); // decrease brightness a bit\n            hasMirror = bounce;\n        }else if (type == 3){ //Microfacet (Glossy), mixture of diffuse and specular\n            vec3 perfect = normalize(reflect(rayDir, smoothNormal));\n            rayDir = sampleGlossyDirection(perfect, matRoughness, rng_state);\n            throughput *= matColor; //Switch to BDF later\n            //Consider fresnel in the future\n            hasMirror = bounce;\n        }else if (type == 4){ //Transmission (Glass)\n            float eta;\n            vec3 transmissionNormal;\n            if(didSwitch){ //exiting\n                eta = matRoughness / 1.0;\n                transmissionNormal = -smoothNormal; // Refract in the opposite direction\n            }else{ //entering\n                eta = 1.0 / matRoughness;\n                transmissionNormal = smoothNormal; // Refract in the same direction\n            }\n            vec3 refracted = refract(rayDir, transmissionNormal, eta);\n            if (length(refracted) < 0.001) {\n                // TIR: fall back to mirror reflection\n                rayDir = normalize(reflect(rayDir, transmissionNormal));\n                rayOrigin = hitPoint + geometricNormal * 0.01;\n            } else {\n                rayDir = normalize(refracted);\n                rayOrigin = hitPoint + rayDir * 0.01;\n            }\n            hasMirror = bounce; // Transmission is not a mirror, but we still track the last bounce\n            vec3 absorption = (vec3(1.0) - matColor)*0.2;  // if matColor is tint\n            throughput *= exp(-absorption * (minHitDistance*0.2)); //Beer Lambert law\n        }else if (type == 5){ // Emissive\n            color += throughput * matColor;\n            break;\n        }\n    }\n    return min(color, vec3(10.0));\n}\n\nvoid main() {\n    //Random Hash\n    uint pixel_x = uint(v_uv.x * u_resolution.x); \n    uint pixel_y = uint(v_uv.y * u_resolution.y);\n    uint seed = hash(pixel_x) + hash(pixel_y * 1999u);\n    uint rng_state = hash(seed + uint(u_frameNumber));\n    rng_state = hash(rng_state + uint(u_frameNumber));\n\n    //Load terrains\n    for(int i = 0; i < NUM_TERRAINS; i++){\n        Terrains[i] = getTerrainType(i);\n    }\n    \n    // Jitter calculation for Anti-Alising\n    uint jitter_rng_state = hash(rng_state); // Create a new state from the main one\n    float jitterX = rand(jitter_rng_state) - 0.5; // Random value in [-0.5, 0.5]\n    float jitterY = rand(jitter_rng_state) - 0.5; // Random value in [-0.5, 0.5]\n    vec2 pixelSize = 1.0 / u_resolution; // Get the size of one pixel in UV space [0, 1].\n\n    vec2 jitteredUV = v_uv + vec2(jitterX, jitterY) * pixelSize;\n    vec2 screenPos = jitteredUV * 2.0 - 1.0; // Convert jittered UV to NDC\n\n    // Define the ray in clip space. 'w' is 1.0 because it's a point.\n    vec4 rayClip = vec4(screenPos, -1.0, 1.0); \n    // Transform from clip space to world space\n    vec4 rayWorld = u_invViewProjMatrix * rayClip;\n    // Perform perspective divide\n    rayWorld /= rayWorld.w;\n    // The ray direction is the vector from the camera to this point in the world\n    vec3 rayDir = normalize(rayWorld.xyz - u_cameraPos);\n    vec3 rayOrigin = u_cameraPos;\n\n    vec3 lastSum = texture(u_lastFrame, v_uv).rgb; //Old color\n    vec3 newSampleColor = PathTrace(rayOrigin, rayDir, rng_state); // Sample Color\n    vec3 newSum = lastSum + newSampleColor; // New sum\n\n    fragColor = vec4(newSum,1.0); \n}\n";


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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
        var numberTerrains = 5;
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

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WorldMap: () => (/* binding */ WorldMap)
/* harmony export */ });
/* harmony import */ var _marching_cubes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./marching_cubes */ "./src/map/marching_cubes.ts");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec2.js");
/* harmony import */ var _Light__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Light */ "./src/map/Light.ts");
/* harmony import */ var _terrains__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./terrains */ "./src/map/terrains.ts");
/* harmony import */ var _Mesh__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Mesh */ "./src/map/Mesh.ts");
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
    function WorldMap(width, height, length) {
        this.lights = [
            new _Light__WEBPACK_IMPORTED_MODULE_1__.Light(gl_matrix__WEBPACK_IMPORTED_MODULE_4__.fromValues(0, 500, 0), new _terrains__WEBPACK_IMPORTED_MODULE_2__.Color(255, 255, 255), 1, 200, new _terrains__WEBPACK_IMPORTED_MODULE_2__.Color(255, 228, 132))
        ];
        this.resolution = 64; //#of vertices square size of chunk
        this.Workers = [];
        this.seed = 10; // Random seed for noise generation
        this.width = width;
        this.length = length;
        this.height = height;
        this.chunks = [];
        for (var i = 0; i < navigator.hardwareConcurrency; i++) {
            this.Workers.push(new Worker(new URL(/* worker import */ __webpack_require__.p + __webpack_require__.u("src_map_Worker_ts"), __webpack_require__.b)));
        }
        this.generate();
        this.fieldMap = new Map();
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
            new _marching_cubes__WEBPACK_IMPORTED_MODULE_0__.Chunk(gl_matrix__WEBPACK_IMPORTED_MODULE_5__.fromValues(0, 0), gl_matrix__WEBPACK_IMPORTED_MODULE_4__.fromValues(this.resolution, this.height, this.resolution), this.seed, this.Workers[0]),
            new _marching_cubes__WEBPACK_IMPORTED_MODULE_0__.Chunk(gl_matrix__WEBPACK_IMPORTED_MODULE_5__.fromValues(this.resolution, 0), gl_matrix__WEBPACK_IMPORTED_MODULE_4__.fromValues(this.resolution, this.height, this.resolution), this.seed, this.Workers[1]),
            new _marching_cubes__WEBPACK_IMPORTED_MODULE_0__.Chunk(gl_matrix__WEBPACK_IMPORTED_MODULE_5__.fromValues(2 * this.resolution, 0), gl_matrix__WEBPACK_IMPORTED_MODULE_4__.fromValues(this.resolution, this.height, this.resolution), this.seed, this.Workers[2]),
            new _marching_cubes__WEBPACK_IMPORTED_MODULE_0__.Chunk(gl_matrix__WEBPACK_IMPORTED_MODULE_5__.fromValues(3 * this.resolution, 0), gl_matrix__WEBPACK_IMPORTED_MODULE_4__.fromValues(this.resolution, this.height, this.resolution), this.seed, this.Workers[3])
        ];
    };
    WorldMap.prototype.combinedMesh = function () {
        var CombinedMesh = new _Mesh__WEBPACK_IMPORTED_MODULE_3__.Mesh();
        for (var _i = 0, _a = this.chunks; _i < _a.length; _i++) {
            var chunk = _a[_i];
            CombinedMesh.merge(chunk.getMesh());
        }
        return CombinedMesh;
    };
    //Renders map (later implementation we don't care abt it rn.)
    WorldMap.prototype.render = function () { };
    return WorldMap;
}());



/***/ }),

/***/ "./src/map/Mesh.ts":
/*!*************************!*\
  !*** ./src/map/Mesh.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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

/***/ "./src/map/Utilities.ts":
/*!******************************!*\
  !*** ./src/map/Utilities.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Chunk: () => (/* binding */ Chunk)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var _geometry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./geometry */ "./src/map/geometry.ts");
/* harmony import */ var _Mesh__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Mesh */ "./src/map/Mesh.ts");
/* harmony import */ var _cubes_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./cubes_utils */ "./src/map/cubes_utils.ts");
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
                            _this.Mesh = new _Mesh__WEBPACK_IMPORTED_MODULE_1__.Mesh();
                            _this.Mesh.setVertices(event.data.meshVertices);
                            _this.Mesh.setNormals(event.data.meshNormals);
                            _this.Mesh.setTypes(event.data.meshTypes);
                            resolve(_this.Mesh);
                        };
                    })];
            });
        });
    };
    Chunk.prototype.getFieldValueWithNeighbors = function (vertex) {
        var _a;
        gl_matrix__WEBPACK_IMPORTED_MODULE_3__.add(vertex, vertex, gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues(this.ChunkPosition[0], 0, this.ChunkPosition[1]));
        var key = (0,_cubes_utils__WEBPACK_IMPORTED_MODULE_2__.vertexKey)(vertex);
        return (_a = this.WorldFieldMap.get(key)) !== null && _a !== void 0 ? _a : 0;
    };
    Chunk.prototype.calculateNormal = function (vertex) {
        var delta = 1.0;
        var normal = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.create();
        // Calculate gradients using central differences
        // X gradient
        var x1 = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues(vertex[0] + delta, vertex[1], vertex[2]);
        var x2 = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues(vertex[0] - delta, vertex[1], vertex[2]);
        normal[0] =
            this.getFieldValueWithNeighbors(x1) - this.getFieldValueWithNeighbors(x2);
        // Y gradient
        var y1 = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues(vertex[0], vertex[1] + delta, vertex[2]);
        var y2 = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues(vertex[0], vertex[1] - delta, vertex[2]);
        normal[1] =
            this.getFieldValueWithNeighbors(y1) - this.getFieldValueWithNeighbors(y2);
        // Z gradient
        var z1 = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues(vertex[0], vertex[1], vertex[2] + delta);
        var z2 = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues(vertex[0], vertex[1], vertex[2] - delta);
        normal[2] =
            this.getFieldValueWithNeighbors(z1) - this.getFieldValueWithNeighbors(z2);
        // Negate and normalize the normal
        gl_matrix__WEBPACK_IMPORTED_MODULE_3__.negate(normal, normal);
        gl_matrix__WEBPACK_IMPORTED_MODULE_3__.normalize(normal, normal);
        return normal;
    };
    Chunk.prototype.set = function (c, value) {
        this.Field[this.chunkCoordinateToIndex(c)] = value;
    };
    Chunk.prototype.getTerrainValue = function (c) {
        return this.Field[this.chunkCoordinateToIndex(c)];
    };
    Chunk.prototype.isSolid = function (c) {
        return Chunk.solidChecker(this.getTerrainValue(c));
    };
    Chunk.prototype.getMesh = function () {
        return this.Mesh;
    };
    /**
     * Meant to future-proof our code - when we may end up needing to use raw field values, instead of rewriting a everchanging solution to check if it is solid use this
     * @param a The value from the field
     * @returns A boolean if it is solid or not
     */
    Chunk.solidChecker = function (a) {
        return a > 0.5;
    };
    Chunk.prototype.CreateMarchingCubes = function () {
        var mesh = new _Mesh__WEBPACK_IMPORTED_MODULE_1__.Mesh();
        for (var x = 0; x < this.GridSize[0]; x++) {
            for (var y = 0; y < this.GridSize[1]; y++) {
                for (var z = 0; z < this.GridSize[2]; z++) {
                    var c = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues(x, y, z);
                    var cubeCase = this.GenerateCase(c);
                    var newMesh = this.caseToMesh(c, cubeCase);
                    mesh.merge(newMesh);
                }
            }
        }
        this.Mesh = mesh;
        return this.Mesh;
    };
    Chunk.prototype.GenerateCase = function (cubeCoordinates) {
        /*
          Given the coordinate of a cube in the world,
          return the corresponding index into the marching cubes lookup.
          Involves looking at each of the eight vertices.
        */
        var caseIndex = 0;
        for (var i = 0; i < _geometry__WEBPACK_IMPORTED_MODULE_0__.VERTICES.length; i++) {
            var vertexOffset = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues.apply(gl_matrix__WEBPACK_IMPORTED_MODULE_3__, _geometry__WEBPACK_IMPORTED_MODULE_0__.VERTICES[i]);
            gl_matrix__WEBPACK_IMPORTED_MODULE_3__.add(vertexOffset, vertexOffset, cubeCoordinates);
            var isTerrain = Number(this.isSolid(vertexOffset));
            caseIndex += isTerrain << i;
        }
        return caseIndex;
    };
    Chunk.prototype.caseToMesh = function (c, caseNumber) {
        var _this = this;
        var caseMesh = new _Mesh__WEBPACK_IMPORTED_MODULE_1__.Mesh();
        var caseLookup = _geometry__WEBPACK_IMPORTED_MODULE_0__.CASES[caseNumber];
        for (var _i = 0, caseLookup_1 = caseLookup; _i < caseLookup_1.length; _i++) {
            var triangleLookup = caseLookup_1[_i];
            // each triangle is represented as list of the three edges which it is located on
            // for now, place the actual triangle's vertices as the midpoint of the edge
            var vertices = triangleLookup.map(function (edgeIndex) {
                return _this.edgeIndexToCoordinate(c, edgeIndex);
            });
            // Add triangle with both position and normal information
            caseMesh.addTriangle(vertices.map(function (v) { return v.position; }), vertices.map(function (v) { return v.normal; }), [0, 0, 0]);
        }
        return caseMesh;
    };
    Chunk.prototype.edgeIndexToCoordinate = function (c, edgeIndex) {
        var _a = _geometry__WEBPACK_IMPORTED_MODULE_0__.EDGES[edgeIndex], a = _a[0], b = _a[1];
        var v1 = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues.apply(gl_matrix__WEBPACK_IMPORTED_MODULE_3__, _geometry__WEBPACK_IMPORTED_MODULE_0__.VERTICES[a]);
        var v2 = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues.apply(gl_matrix__WEBPACK_IMPORTED_MODULE_3__, _geometry__WEBPACK_IMPORTED_MODULE_0__.VERTICES[b]);
        gl_matrix__WEBPACK_IMPORTED_MODULE_3__.add(v1, v1, c);
        gl_matrix__WEBPACK_IMPORTED_MODULE_3__.add(v2, v2, c);
        // this formula works by guessing where along the edge you would find 0.5
        // Is there a better way to write this? :/
        var weight1 = this.getTerrainValue(v1) - 0.5;
        var weight2 = this.getTerrainValue(v2) - 0.5;
        var normal1 = this.calculateNormal(v1);
        var normal2 = this.calculateNormal(v2);
        var lerpAmount = weight1 / (weight1 - weight2);
        var position = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.create();
        var normal = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.create();
        gl_matrix__WEBPACK_IMPORTED_MODULE_3__.lerp(position, v1, v2, lerpAmount);
        gl_matrix__WEBPACK_IMPORTED_MODULE_3__.lerp(normal, normal1, normal2, lerpAmount);
        return { position: position, normal: normal };
    };
    return Chunk;
}());



/***/ }),

/***/ "./src/map/terrains.ts":
/*!*****************************!*\
  !*** ./src/map/terrains.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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
    /**
     * Creates a vec3 from the color values
     * @returns vec3 with color values.
     * @remarks Note that these values are automatically switched to out of 1.
     */
    Color.prototype.createVec3 = function () {
        return gl_matrix__WEBPACK_IMPORTED_MODULE_0__.fromValues(this.r / 255, this.g / 255, this.b / 255);
    };
    return Color;
}());

/**
 * The class for calculating the information for all our terrain types
 */
var Terrains = {
    //NOTE: WHEN ADD TERRAINS CHANGE numberTerrains in packTerrainTypes in BVHUtils.ts and NUM_TERRAINS in glslPath.ts
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

/***/ "./src/render/Camera.ts":
/*!******************************!*\
  !*** ./src/render/Camera.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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
        this.TriangleBuffer = null;
        this.CubeBuffer = null;
        this.MeshSize = 0;
        this.gl = gl;
        this.canvas = canvas;
        this.camera = camera;
        this.debug = debug;
        this.world = world;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL); // Ensures closer objects are drawn in front
        this.CubeShader = new _Shader__WEBPACK_IMPORTED_MODULE_2__.Shader(gl, _glsl__WEBPACK_IMPORTED_MODULE_1__.CubeVertexShaderCode, _glsl__WEBPACK_IMPORTED_MODULE_1__.CubeFragmentShaderCode);
        this.MeshShader = new _Shader__WEBPACK_IMPORTED_MODULE_2__.Shader(gl, _glsl__WEBPACK_IMPORTED_MODULE_1__.MeshVertexShaderCode, _glsl__WEBPACK_IMPORTED_MODULE_1__.MeshFragmentShaderCode);
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
        this.MeshSize = triangleIndices.length;
        this.TriangleBuffer = _GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.CreateStaticBuffer(this.gl, new Float32Array(triangleVertices), triangleIndices);
        this.CubeBuffer = _GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.CreateStaticBuffer(this.gl, new Float32Array(_map_geometry__WEBPACK_IMPORTED_MODULE_4__.cubeVertices), _map_geometry__WEBPACK_IMPORTED_MODULE_4__.cubeWireframeIndices);
        this.CubeShader = new _Shader__WEBPACK_IMPORTED_MODULE_2__.Shader(this.gl, _glsl__WEBPACK_IMPORTED_MODULE_1__.CubeVertexShaderCode, _glsl__WEBPACK_IMPORTED_MODULE_1__.CubeFragmentShaderCode);
        this.MeshShader = new _Shader__WEBPACK_IMPORTED_MODULE_2__.Shader(this.gl, _glsl__WEBPACK_IMPORTED_MODULE_1__.MeshVertexShaderCode, _glsl__WEBPACK_IMPORTED_MODULE_1__.MeshFragmentShaderCode);
        this.matViewProj = gl_matrix__WEBPACK_IMPORTED_MODULE_5__.create();
    };
    GLRenderer.prototype.drawMesh = function (TransformationMatrix) {
        this.gl.useProgram(this.MeshShader.Program);
        _GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.updateLights(this.gl, this.MeshShader.Program, this.world.lights, this.camera);
        this.gl.uniformMatrix4fv(this.MeshShader.VertexUniforms["MatrixTransform"].location, false, TransformationMatrix);
        this.gl.uniformMatrix4fv(this.MeshShader.VertexUniforms["matViewProj"].location, false, this.matViewProj);
        //Create vertice array object
        if (!this.TriangleBuffer) {
            console.error("TriangleBuffer not initialized.");
            return;
        }
        var triangleVao = _GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.createInterleavedVao(this.gl, this.TriangleBuffer.vertex, this.TriangleBuffer.indices, this.MeshShader, {
            VertexPosition: { offset: 0, stride: 36, sizeOverride: 3 },
            VertexNormal: { offset: 12, stride: 36 },
            VertexColor: { offset: 24, stride: 36 }
        });
        this.gl.bindVertexArray(triangleVao);
        this.gl.drawElements(this.gl.TRIANGLES, this.MeshSize, this.gl.UNSIGNED_INT, 0);
        this.gl.bindVertexArray(null);
    };
    GLRenderer.prototype.DrawWireFrameCube = function (TransformationMatrix) {
        this.gl.useProgram(this.CubeShader.Program);
        this.gl.uniformMatrix4fv(this.CubeShader.VertexUniforms["MatrixTransform"].location, false, TransformationMatrix);
        this.gl.uniformMatrix4fv(this.CubeShader.VertexUniforms["matViewProj"].location, false, this.matViewProj);
        if (!this.CubeBuffer)
            throw new Error("CubeBuffer not initialized.");
        var cubeVao = _GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.createInterleavedVao(this.gl, this.CubeBuffer.vertex, this.CubeBuffer.indices, this.CubeShader, {
            VertexPosition: { offset: 0, stride: 24, sizeOverride: 3 },
            VertexColor: { offset: 12, stride: 24 }
        });
        this.gl.bindVertexArray(cubeVao);
        this.gl.drawElements(this.gl.LINES, 24, this.gl.UNSIGNED_INT, 0);
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
        this.drawMesh(_GlUtils__WEBPACK_IMPORTED_MODULE_0__.GlUtils.CreateTransformations(gl_matrix__WEBPACK_IMPORTED_MODULE_6__.fromValues(0, 0, 0), gl_matrix__WEBPACK_IMPORTED_MODULE_6__.fromValues(0, 0, 0), gl_matrix__WEBPACK_IMPORTED_MODULE_6__.fromValues(resScaleFactor, resScaleFactor, resScaleFactor)));
    };
    return GLRenderer;
}());



/***/ }),

/***/ "./src/render/GlUtils.ts":
/*!*******************************!*\
  !*** ./src/render/GlUtils.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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
/******/ 		__webpack_require__.h = () => ("8bb5be3431d2c14ff7fd")
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