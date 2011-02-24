/* Font Wars Sound Library
Copyright 2011, Oran Looney

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
var sound = {
	fx: {
		sounds: {},
		multi: 4,
		masterVolume: 1.0,

		load: function(label, resource, volume) {
			if ( volume === undefined ) volume = 1.0;
			var channels = [];
			channels.volume = volume;
			this.sounds[label] = channels;
			for ( var i=0; i<this.multi; i++ ) {
				var audio = new Audio(resource);
				channels.push(audio);
				// *force* the audio to load.
				audio.volume = 0;
				audio.play(); 
			}
			return this;
		},

		_each: function(label, fn) {
			var channels = this.sounds[label];
			if ( !channels ) throw Error("no \"" + label + "\" sound effect!");
			for ( var i=0; i < channels.length; i++ ) {
				var done = fn.call(this, channels[i], i, channels);
				if ( done ) return this;
			}
			return this;
		},
		
		// play a short sound effect immediately
		play: function(label, volume) { 
			return this._each(label, function(audio, i, channels) {
				if( audio.ended == true || audio.currentTime == 0 ) {
					if ( volume === undefined ) volume = channels.volume;
					audio.volume = this.masterVolume * volume;
					audio.currentTime = 0;
					audio.play();
					return true;
				}
			});
		}
	},

	music: {
		masterVolume: 0.5,
		tracks: {},
		timeouts: [],
		current: undefined,

		load: function(label, resource) {
			this.tracks[label] = new Audio(resource);
			return this;
		},

		stop: function() {
			for ( var i=0; i < this.timeouts.length; i++ ) {
				clearTimeout(this.timeouts[i]);
			}
			this.timeouts = [];
			if ( !this.current ) return this;
			this.current.pause();
			this.current.currentTime = 0;
			delete this.current;
			return this;
		},

		_timeout: function(duration, fn) {
			var music = this;
			this.timeouts.push(setTimeout(function() {
				fn.call(music);
			}, duration));
			return this;
		},

		_start: function(label, volume) {
			var audio = this.tracks[label];
			if ( !audio ) throw Error("no music track \"" + label + "\"");
			this.current = audio;
			if ( volume === undefined ) volume = 1;
			this.current.volume = this.masterVolume * (volume);
			this.current.play();
			return this;
		},

		volume: function(volume, fade) {
			if ( !this.current ) return this;
			if ( fade === undefined ) {
				this.current.volume = volume * this.masterVolume;
			} else {
				var initialVolume = this.current.volume;
				for ( var i=1; i<=10; i++ ) (function(i) {
					this._timeout(fade * i/10, function() {
						this.volume(initialVolume + (volume * this.masterVolume - initialVolume) * i/10);
					});
				}).call(this, i);
			}
			return this;
		},

		play: function(label, volume, fade, callback, scope) {
			if ( volume === undefined ) volume = 1.0;
			if ( fade === undefined ) fade = 200;
			this.stop()._start(label, 0).volume(volume, fade);

			var timeToEnd = Math.round( (this.current.duration - this.current.currentTime ) * 1000 );

			this._timeout(timeToEnd - fade, function() {
				this.volume(0.0, fade);
			});

			this._timeout(timeToEnd, function() {
				this.stop();
				if ( callback ) callback.call(scope, this);
			});
		},

		loop: function(label, volume, fade) {
			if ( volume === undefined ) volume = 1.0;
			if ( fade === undefined ) fade = 10;
			this.play(label, volume, fade, function() {
				this.loop(label, volume, fade);
			}, this);
		}
	}
};
