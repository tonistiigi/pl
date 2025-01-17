goog.provide('DemoHost');

goog.require('demos');
goog.require('goog.History');
goog.require('goog.Timer');
goog.require('goog.asserts');
goog.require('goog.debug.LogManager');
goog.require('goog.dom');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.style');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Select');
goog.require('pl.DebugDiv');
goog.require('pl.FpsLogger');
goog.require('pl.ex');
goog.require('pl.images');

/**
 * @constructor
 */
DemoHost = function() {
  pl.DebugDiv.enable();
  goog.style.setUnselectable(document.body, true);

  this._logger = goog.debug.LogManager.getRoot();
  this._fpsLogger = new pl.FpsLogger();

  //
  // Demo Selector
  //
  this._selectControl = new goog.ui.Select('Pick a demo...');
  goog.object.forEach(demos.all, function(e, k, o) {
    this._selectControl.addItem(new goog.ui.MenuItem(k));
  },
  this);
  this._selectControl.render(goog.dom.getElement('DemoSelect'));

  goog.events.listen(this._selectControl, goog.ui.Component.EventType.ACTION, function(e) {
    var value = goog.string.urlEncode(e.target.getValue());
    this._history.setToken(value);
  },
  false, this);

  //
  // History!
  //
  var historyElement =
  /** @type {!HTMLInputElement} */
  document.getElementById('history_state');

  this._history = new goog.History(false, undefined, historyElement);
  this._history.addEventListener(goog.history.EventType.NAVIGATE, this._navigate, false, this);
  this._history.setEnabled(true);

  this._frameFunc = goog.bind(this._drawFrame, this);

  this._drawFrame();
  this._updateHUD();
};

/**
 * @export
 */
DemoHost.load = function() {
  DemoHost.images = new pl.images({
    'stars': 'resources/stars.png',
    'pixellab': 'resources/pixellab.png'
  });
  DemoHost.images.load(function(p) {},
  function() {
    goog.global['$demoHost'] = new DemoHost();
  });
};

DemoHost.images = null;

DemoHost.prototype._frameMs = 0;

DemoHost.prototype._navigate = function(e) {
  var demoName;
  if (e.token.length === 0) {
    demoName = goog.object.getAnyKey(demos.all);
  } else {
    demoName = goog.string.urlDecode(e.token);
  }
  var demo = demos.all[demoName];
  goog.asserts.assert(demo, 'should have a valid demo here!');
  this._selectControl.setValue(demoName);
  this._loadDemo(demo);
};

DemoHost.prototype._loadDemo = function(demoCtr) {
  var newCanvas = goog.dom.createDom('canvas', {
    'id': 'content',
    'width': 500,
    'height': 500
  });
  goog.style.setStyle(newCanvas, 'background', 'black');
  goog.dom.replaceNode(newCanvas, document.getElementById('content'));

  this._demo = new demoCtr(newCanvas);
};

DemoHost.prototype._drawFrame = function() {
  this._fpsLogger.AddInterval();

  if (this._demo) {
    this._demo.frame();
  }

  this._requestFrame();
};

DemoHost.prototype._requestFrame = function() {
  if (this._frameMs) {
    goog.Timer.callOnce(this._frameFunc, this._frameMs);
  } else {
    pl.ex.requestAnimationFrame(this._frameFunc);
  }
};

DemoHost.prototype._updateHUD = function() {
  pl.DebugDiv.clear();
  this._logger.info(String(this._fpsLogger.fps));

  var func = goog.bind(this._updateHUD, this);
  goog.Timer.callOnce(func, 2000);
};
