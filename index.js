(function() {
'use strict';

// Stolen from the internet.
window.requestAnimationFrameEx =
    window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function(callback, element) {
        window.setTimeout(callback, 1000 / 60);
    };

function createWorld() {
    // These values need to be large or planets outside the bounds
    // will suddenly drop to velocity 0 and you won't have any idea
    // what's going on.
    var aabb = new b2AABB();
    aabb.minVertex.Set(-10000, -10000);
    aabb.maxVertex.Set(10000, 10000);

    var gravity = new b2Vec2(0, 0);
    var sleep = true;
    var world = new b2World(aabb, gravity, sleep);
    return world;
}

// Our two constants.
var world = createWorld();
var sun = new Planet(new b2Vec2(50, 100), new b2Vec2(0, 0));

function Planet(start, velocity, radiusFactor) {
    var circleDef = new b2CircleDef();
    circleDef.radius = radiusFactor * 10;
    circleDef.restituion = 1.0;
    circleDef.friction = 0.0;
    circleDef.density = 1.0;

    var bodyDef = new b2BodyDef();
    bodyDef.AddShape(circleDef);
    bodyDef.position = start.Copy();
    bodyDef.linearVelocity = velocity.Copy();

    var body = world.CreateBody(bodyDef);
    var circle = body.GetShapeList();
    var me = this;

    this.position = function() {
        return body.m_position;
    };

    this.velocity = function() {
        return body.m_linearVelocity;
    };

    this.gravity = function(sun) {
        body.ApplyForce(centripetal(sun, me), me.position());
    };

    this.drawOrbit = function(context) {
        var pos = this.position();
        var center = sun.position();
        context.moveTo(center.x + me.distance, center.y);
        context.arc(center.x, center.y, me.distance, 0, Math.PI * 2, true);
    }

    this.draw = function(context) {
        var pos = this.position();
        var center = sun.position();
        context.beginPath();
        context.arc(pos.x, pos.y, circleDef.radius, 0, Math.PI * 2, true);
        context.stroke();
        context.fill();
    };

    this.shouldDrawText = function() {
        // TODO: technically, this should check angle of rotation.
        var pos = this.position();
        return pos.x > 100 && pos.y > 200;
    };

    if (velocity.Length() > 0) {
        // Can't be the sun.
        var inward = sun.position().Copy();
        inward.Subtract(me.position());
        var dist = inward.Normalize();
        var velocity = body.m_linearVelocity.Length();
        this.distance = dist;
        this.magnitude = body.m_mass * velocity * velocity / dist;
    }
}

function centripetal(sun, planet) {
    var inward = sun.position().Copy();
    inward.Subtract(planet.position());
    var dist = inward.Normalize();
    var velocity = planet.velocity().Length();
    inward.Multiply(planet.magnitude);
    return inward;
}

function position(factor) {
    var dist = factor * 200;
    return new b2Vec2(sun.position().x + dist, sun.position().y);
}

function velocity(factor) {
    var v = new b2Vec2(0, 100);
    v.Multiply(factor);
    return v;
}

function galaxy(text, width, height) {
    var mercury = new Planet(position(0.387), velocity(1.607), 0.382);
    var venus = new Planet(position(0.723), velocity(1.174), 0.948);
    var earth = new Planet(position(1), velocity(1), 1);
    var mars = new Planet(position(1.5233), velocity(0.802), 0.553);
    var jupiter = new Planet(position(5.202), velocity(0.434), 11.2);

    // TODO: make more fucked up.
    var planets = [mercury, venus, earth, mars, jupiter];
    var messages = [
        '',
        'Jim, I love you.',
        'Karen, I know. Let me rest.',
        'Jim, don\'t turn away from me.',
        '...',
        'Goddammit. Jim!',
        '...',
        '(click of a gun)',
        'Karen? Karen! No! What are you doing?!',
        '(gunshot)',
        'No. NO!',
        '(gunshot)',
        '(Jim\'s eyes bulge and then he is gone)',
        'I know now alive /',
        'to push in time /',
        'to leave a wake of regret /',
        'to blink wetness away.'
    ];

    function updateText() {
        messages.push(messages.shift());
        text.update(messages[0]);
    }

    text.observe('click', updateText);

    function draw(context, text) {
        context.strokeStyle = '#eee';
        context.lineWidth = 1;
        context.beginPath();
        planets.each(function(planet) {
            planet.drawOrbit(context);
        });
        context.stroke();

        context.strokeStyle = '#aaa';
        context.lineWidth = 2;
        context.fillStyle = 'white';
        planets.each(function(planet) {
            planet.draw(context);
            planet.gravity(sun);
        });

        if (earth.shouldDrawText()) {
            text.style.left = earth.position().x + 'px';
            text.style.top = earth.position().y + 'px';
            if (text.style.display != 'block') {
                updateText();
                text.style.display = 'block';
            }
        }
        else {
            text.style.display = 'none';
        }
    }

    function step(ctx) {
        world.Step(1.0 / 60, 1);
        ctx.clearRect(0, 0, width, height);
        draw(ctx, text);
        requestAnimationFrameEx(function() { step(ctx) });
    }

    return step;
}

function main() {
    var canvas = $$('canvas')[0];
    var context = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var text = $('text');
    var step = galaxy(text, canvas.width, canvas.height);
    step(context);
}

// Firefox doesn't work with dom:loaded, just do this instead.
main();

})();
