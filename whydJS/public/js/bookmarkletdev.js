/**
 * openwhyd bookmarklet v2
 * @author adrienjoly, whyd
 **/

// prevents bug in firefox 3
if (undefined == window.console) 
	console = {log:function(){}, info:function(){}, error:function(){}, warn:function(){}};

console.log("-= openwhyd bookmarklet v2 =-");

(function(){

	var FILENAME = "/js/bookmarkletdev.js"; // TODO

	// close the bookmarklet by pressing ESC

	window.onkeydownBackup = window.onkeydownBackup || window.document.onkeydown;

	window.closeWhydBk = function() {
		document.body.removeChild(document.getElementById('whydBookmarklet'));
		window.document.onkeydown = window.onkeydownBackup;
		delete window.onkeydownBackup;
		delete window.closeWhydBk;
	};
	
	window.document.onkeydown = function(e){
		if ((e || event).keyCode == 27)
			closeWhydBk();
	};

	// utility functions

	function findScriptHost(scriptPathName) {
		var els = document.getElementsByTagName("script");
		for(var i = els.length - 1; i > -1; --i) {
			var whydPathPos = els[i].src.indexOf(scriptPathName);
			if(whydPathPos > -1)
				return els[i].src.substr(0, whydPathPos);
		}
	}

	function getSelText() {
		var SelText = '';
		if (window.getSelection) {
			SelText = window.getSelection();
		} else if (document.getSelection) {
			SelText = document.getSelection();
		} else if (document.selection) {
			SelText = document.selection.createRange().text;
		}
		return SelText;
	}

	function getNodeText(node){
		return node.innerText || node.textContent;
	}

	function unwrapFacebookLink(src) {
		// e.g. http://www.facebook.com/l.php?u=http%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DKhXn0anD1lE&h=AAQFjMJBoAQFTPOP4HzFCv0agQUHB6Un31ArdmwvxzZxofA
		var fbLink = src.split("facebook.com/l.php?u=");
		if (fbLink.length>1) {
			fbLink = decodeURIComponent(fbLink.pop().split("&").shift());
			var result = fbLink.indexOf("//www.facebook.com/") == -1 ? fbLink : src;
			return result;
		}
		return src;
	}

	function include(src, cb) {
		var inc, timer;
		if (src.split(/[\#\?]/)[0].split(".").pop().toLowerCase() == "css") {
			inc = document.createElement("link");
			inc.rel = "stylesheet";
			inc.type = "text/css";
			inc.media = "screen";
			inc.href = src;
		}
		else {
			inc = document.createElement("script");
			inc.onload = function(loaded) {
				timer = timer ? clearInterval(timer) : null;
				cb && cb();
			}
			function check() {
				if (inc.readyState && (inc.readyState == "loaded" || inc.readyState == "complete" || inc.readyState == 4))
					inc.onload();
			}
			timer = cb ? setInterval(check, 500) : undefined;
			inc.onreadystatechange = check;
			inc.type = "text/javascript";
			inc.src = src;
		}
		document.getElementsByTagName("head")[0].appendChild(inc);
	};
	
	// PARAMETERS
	
	var urlPrefix = findScriptHost(FILENAME) || "https://openwhyd.org",
		urlSuffix = "?" + (new Date()).getTime();

	// user interface

	function BkUi(){

		this.nbTracks = 0;

		var div = document.getElementById("whydBookmarklet");
		if (!div) {
			document.body.appendChild(document.createElement('div')).id = "whydBookmarklet";
			div = document.getElementById("whydBookmarklet");
		}

		div.innerHTML = [
			'<div id="whydHeader">',
				'<a target="_blank" href="'+urlPrefix+'"><img src="'+urlPrefix+'/images/logo-s.png"></a>',
				'<div onclick="closeWhydBk();"><img src="'+urlPrefix+'/images/btn-close.png"></div>',
			'</div>',
			'<div id="whydContent">',
				'<div id="whydLoading">',
					'<p>Extracting tracks,</p>',
					'<p>please wait...</p>',
					'<img src="'+urlPrefix+'/images/loader.gif" style="display:inline;">',
				'</div>',
			'</div>'
		].join('\n');

		function showForm(thumb) {
			var text = getSelText();
			var href = urlPrefix + '/post?embed=' + encodeURIComponent(thumb.url)
				+ (thumb.title ? '&title=' + encodeURIComponent(thumb.title) : '')
				+ '&refUrl=' + encodeURIComponent(window.location.href)
				+ '&refTtl=' + encodeURIComponent(document.title)
				+ (text ? '&text=' + encodeURIComponent(text) : '');
			var whydPop = window.open(href, "whydPop", "height=330,width=510,location=no,menubar=no,resizable=no,scrollbars=no,toolbar=no");
		}

		function renderThumb(thumb) {
			var divThumb = document.createElement("div");
			divThumb.setAttribute("id", thumb.id);
			divThumb.setAttribute("class", "whydThumb");
			divThumb.setAttribute("title", thumb.title);
			var divCont = document.createElement("div");
			divCont.setAttribute("class", "whydCont");
			divCont.appendChild(thumb.element);
			var textNode = document.createTextNode(thumb.title);
			var title = document.createElement("p");
			title.appendChild(textNode);
			divThumb.appendChild(divCont);
			divThumb.appendChild(title);
			var btnShareIt = document.createElement("img");
			btnShareIt.setAttribute("src", urlPrefix + "/images/btn-shareit.png");
			divThumb.appendChild(btnShareIt);
			return divThumb;
		}

		var contentDiv = document.getElementById("whydContent");

		this.addThumb = function(thumb) {
			thumb.id = 'whydThumb' + (this.nbTracks++);
			thumb.element = document.createElement("img");
			thumb.element.src = thumb.img;
			var divThumb = renderThumb(thumb);
			divThumb.onclick = function() {
				showForm(thumb);
			};
			contentDiv.appendChild(divThumb);
		}

		this.addSearchThumb = function(track) {
			var img = document.createElement("img");
			img.src = urlPrefix + "/images/cover-track.png";
			var divThumb = renderThumb({
				id: 'whydThumb' + (this.nbTracks++),
				title: track.name || track.title || "Search Whyd",
				element: img,
			}), href = "http://openwhyd.org/search?q=" + encodeURIComponent(track.name);
			divThumb.onclick = function() {
				var whydPop = window.open(href, "whydSearch");
			};
			contentDiv.appendChild(divThumb);
		}
		
		this.finish = function(html) {
			document.getElementById("whydLoading").innerHTML = this.nbTracks ? ""
				: "No tracks were detected on this page, sorry..." + (html || "");
		}

		return this;
	}

	// Track detectors
	
	function makeFileDetector(eidSet){
		var eidSet = {}; // to prevent duplicates
		return function detectMusicFiles(url, cb, e) {
			var title = decodeURIComponent((url.match(/([^\/]+)\.(?:mp3|ogg)$/) || []).pop() || ""),
				alt = [e.title, e.innerText, e.textContent];
			if (eidSet[url] || !title)
				return cb();
			for (var i = 0; i < alt.length; ++i) {
				var trimmed = e.title.replace(/^\s+|\s+$/g, '');
				if (trimmed) {
					title = trimmed;
					break;
				}
			}
			eidSet[url] = true;
			cb({
				id: url,
				title: title,
				img: urlPrefix + '/images/cover-audiofile.png',
			});
		};
	}

	function makePlayemStreamDetector(eidSet){
		window.SOUNDCLOUD_CLIENT_ID = "eb257e698774349c22b0b727df0238ad";
		window.DEEZER_APP_ID = 125765;
		window.DEEZER_CHANNEL_URL = urlPrefix + "/html/deezer.channel.html";
		window.JAMENDO_CLIENT_ID = "c9cb2a0a";	
		var players = { // playem-all.js must be loaded at that point
				yt: new YoutubePlayer({}, {playerContainer: document.getElementById("videocontainer")}),
				sc: new SoundCloudPlayer({}),
				vi: new VimeoPlayer({}),
				dm: new DailymotionPlayer({}),
				dz: new DeezerPlayer({}),
				bc: new BandcampPlayer({}),
				ja: new JamendoPlayer({}),
			}, eidSet = {}; // to prevent duplicates
		function getPlayerId(url){
			for (var i in players) {
				var player = players[i];
				var eId = player.getEid(url);
				if (eId)
					return i;
			}
		}
		function detect(url, cb){
			var playerId = getPlayerId(url);
			var player = playerId && players[playerId];
			cb(player && ("/" + playerId + "/" + player.getEid(url)), player);
		}
		return function detectPlayemStreams(url, cb){
			detect(url, function(eid, player){
				if (!eid || eidSet[eid])
					return cb();
				eidSet[eid] = true;
				if (!player || !player.fetchMetadata)
					return cb({eId: eId});
				else
					player.fetchMetadata(url, function(track){
						track = track || {};
						track.eId = eid;
						cb(track);
					});
			});
		};
	}

	// each page detector is called once, without parameters, and returns a list of fake element objects
	// (with fields {name:} or {src:}) to extract streams from.
	var PAGE_DETECTORS = [
		function detectPandoraTrack(){
			if (window.location.href.indexOf("pandora.com") == -1)
				return null;
			var artist = getNodeText(document.getElementsByClassName("playerBarArtist")[0] || {}),
				title = getNodeText(document.getElementsByClassName("playerBarSong")[0] || {});
			return artist && title ? [{ name: artist + " - " + title }] : [];
		},
		function detectDeezerTrack(){
			var dzTrackId = window.dzPlayer && window.dzPlayer.getSongId();
			return dzTrackId ? [{ src: "https://www.deezer.com/track/" + dzTrackId }] : [];
		},
		function detectTrackFromTitle() {
			var title = document.title.replace(/[▶\<\>\"\']+/g, " ").replace(/[ ]+/g, " ");
			var titleParts = [" - Spotify", " | www.deezer.com", " - Xbox Music", " - Royalty Free Music - Jamendo"];
			for(var i=0; i<titleParts.length; ++i)
				if (title.indexOf(titleParts[i]) > -1)
					return [{name: title.replace(titleParts[i], "")}];
		},
	];

	// each track detector is called once, without parameters, and returns a list of fake element objects
	// (with fields {href:} or {src:}) to extract streams from.
	var TRACK_DETECTORS = [
		function extractBandcampTracks(){
			var toDetect = [];
			// list Bandcamp track URLs
			var bandcampPageUrl = document.querySelector && document.querySelector('meta[property="og:url"]');
			if (!bandcampPageUrl)
				return [];
			bandcampPageUrl = bandcampPageUrl.getAttribute("content");
			if (bandcampPageUrl.indexOf("bandcamp.com/track/") != -1)
				toDetect.push({src: bandcampPageUrl});
			else {
				var pathPos = bandcampPageUrl.indexOf("/", 10);
				if (pathPos != -1)
					bandcampPageUrl = bandcampPageUrl.substr(0, pathPos); // remove path
				var elts = document.querySelectorAll('a[href^="/track/"]');
				for (var j=0; j<elts.length; ++j)
					toDetect.push({href: bandcampPageUrl + elts[j].getAttribute("href")});
			}
			return toDetect;
			// TODO: document.querySelectorAll('script[title*="bandcamp.com/download/track"]') // only works on track and album pages
		},
	];

	function detectTracks(ui, URL_DETECTORS) {

		var elementNames = ["iframe", "object", "embed", "a", "audio", "source"];
		
		// an url-based detector must callback with a track Object (with fields: {id, eId, title, img}) as parameter, if detected
		var URL_DETECTORS = [
			makeFileDetector(),
			makePlayemStreamDetector(),
		];

		function detectTrack(url, cb, element) {
			//console.info("testing URL", url, "...");
			var urlDetectors = URL_DETECTORS.slice();
			(function processNext() {
				if (!urlDetectors.length)
					cb();
				else
					urlDetectors.shift()(url, function(track){
						//console.info("=>", track);
						if (track && track.id)
							cb(track);
						else
							processNext();
					}, element);
			})()
		}

		function detectEmbed(e, cb){
			var url = unwrapFacebookLink(e.href || e.src || e.data || "");
			if (!url)
				return cb && cb();
			detectTrack(url, function(track){
				if (track){
					console.info("=> detected", track);
					track = track || {};
					track.url = url;
					track.title = track.title || e.textNode || e.title || e.alt || track.eId || url; // || p.label;
					ui.addThumb(track);
				}
				cb();
			}, e);
		}

		function whenDone(){
			console.info("finished detecting tracks!");
			if (!ui.nbTracks)
				ui.addSearchThumb({name: document.title});
			ui.finish();
		}

		var toDetect = new (function ElementStack(){
			// this class holds a collections of elements that potentially reference streamable tracks
			var set = {};
			this.push = function(elt){
				var url = unwrapFacebookLink(elt.href || elt.src || elt.data || "").split("#")[0];
				if (!elt || !url || url.indexOf("javascript:") == 0 || url.indexOf("#") == 0)
					return;
				set[url] = elt;
			};
			this.pushAll = function(elts){
				for (var j=0; j<elts.length; ++j)
					this.push(elts[j]);
			};
			this.shift = function(){
				var keys = Object.keys(set), val;
				if (keys.length){
					val = set[keys[0]];
					delete set[keys[0]];
				}
				return val;
			};
		})();

		console.info("detecting tracks from page...");
		toDetect.push({ src: window.location.href });

		console.info("1/4 parse page metadata...");
		PAGE_DETECTORS.map(function(detect){
			var res = detect();
			if (!res)
				return;
			res.map(function(track){
				if (track && track.name)
					ui.addSearchThumb(track);
				else if (track && track.src)
					toDetect.push(track);
			});
		});

		console.info("2/4 parse elements...");
		elementNames.map(function(elName){
			toDetect.pushAll(document.getElementsByTagName(elName));
		});

		console.info("3/4 parse other elements...");
		TRACK_DETECTORS.map(function(detect){
			var tracks = detect();
			//if (tracks && tracks.length)
				toDetect.pushAll(tracks);
		});

		console.info("4/4 detecting streamable tracks...");
		(function processNext() {
			var elt = toDetect.shift();
			if (!elt)
				whenDone();
			else
				detectEmbed(elt, processNext);
		})();
	}

	console.info("initWhydBookmarklet...");
	include(urlPrefix + "/css/bookmarklet.css" + urlSuffix);
	var ui = new BkUi();
	console.info("loading PlayemJS...");
	include(urlPrefix + "/js/playem-min.js" + urlSuffix, function(){
		detectTracks(ui);
	});
})();