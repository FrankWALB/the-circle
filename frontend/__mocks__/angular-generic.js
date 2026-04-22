// Catch-all stub for @angular/* packages not specifically mocked.
// Provides identity decorators and empty stubs so component files can be
// imported and their methods tested without the Angular runtime.

const classDecorator = () => cls => cls;
const paramDecorator = () => () => {};

class Stub {}

module.exports = new Proxy(
  {
    // Decorators
    Component:       classDecorator,
    Directive:       classDecorator,
    Pipe:            classDecorator,
    NgModule:        classDecorator,
    Input:           paramDecorator,
    Output:          paramDecorator,
    ViewChild:       paramDecorator,
    ContentChild:    paramDecorator,
    HostListener:    paramDecorator,
    SkipSelf:        paramDecorator,
    Optional:        paramDecorator,
    Inject:          () => () => {},

    // Lifecycle interfaces (used as implements target only)
    OnInit: Stub, OnDestroy: Stub, AfterViewInit: Stub,

    // Common tokens / misc
    InjectionToken: class { constructor(desc) { this.desc = desc; } },
    EventEmitter:   class { emit = jest.fn(); subscribe = jest.fn(); },
    DOCUMENT:       'DOCUMENT',

    // Router (used as type only – real instances are passed in tests)
    Router:          class { navigate = jest.fn(); },
    ActivatedRoute:  class { snapshot = { paramMap: { get: () => null } }; },
    RouterModule:    Stub,
    RouterLink:      Stub,

    // Forms
    FormsModule:          Stub,
    ReactiveFormsModule:  Stub,

    // Common
    CommonModule: Stub,
    AsyncPipe:    Stub,
    DatePipe:     Stub,

    // Material Dialog
    MatDialogRef: class {
      close       = jest.fn();
      afterClosed = () => ({ subscribe: jest.fn() });
    },
    MAT_DIALOG_DATA: 'MAT_DIALOG_DATA',
    MatDialogModule: Stub,

    // Generic module stubs (Angular Material, CDK, etc.)
    MatCardModule:        Stub, MatButtonModule:    Stub,
    MatIconModule:        Stub, MatInputModule:     Stub,
    MatFormFieldModule:   Stub, MatChipsModule:     Stub,
    MatDividerModule:     Stub, MatListModule:      Stub,
    MatTableModule:       Stub, MatExpansionModule: Stub,
    MatSnackBarModule:    Stub, MatToolbarModule:   Stub,
    MatSidenavModule:     Stub, MatCheckboxModule:  Stub,
    MatSelectModule:      Stub, MatMenuModule:      Stub,
  },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      // Any unknown named export: return a no-op class decorator
      return classDecorator;
    },
  },
);
