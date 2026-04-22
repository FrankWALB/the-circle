// Stub for @angular/core used in Jest unit tests.
// Decorators are identity functions; services are instantiated directly.
const classDecorator = () => cls => cls;
const paramDecorator = () => () => {};

module.exports = {
  Injectable:     classDecorator,
  Component:      classDecorator,
  Directive:      classDecorator,
  Pipe:           classDecorator,
  NgModule:       classDecorator,
  Input:          paramDecorator,
  Output:         paramDecorator,
  ViewChild:      paramDecorator,
  ContentChild:   paramDecorator,
  HostListener:   paramDecorator,
  Inject:         () => () => {},
  SkipSelf:       paramDecorator,
  Optional:       paramDecorator,
  OnInit:         class {},
  OnDestroy:      class {},
  AfterViewInit:  class {},
  InjectionToken: class { constructor(desc) { this.desc = desc; } },
  EventEmitter:   class { emit = jest.fn(); subscribe = jest.fn(); },
  PLATFORM_ID:    'browser',
};
