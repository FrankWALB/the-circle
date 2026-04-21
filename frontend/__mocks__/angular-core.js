// Minimal stub of @angular/core for Jest unit tests.
// The decorators are no-ops; we instantiate services directly without Angular DI.
const Injectable = () => target => target;
const Inject = () => () => {};

module.exports = { Injectable, Inject };
