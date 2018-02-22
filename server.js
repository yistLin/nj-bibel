// server.js
const express = require('express'),
      fs = require('fs'),
      app = express()


// definitions
const defn = require('./settings'),
      nb_chapters = defn.nb_chapters,
      testament = defn.testament,
      booknames = defn.booknames,
      abbr_booknames = defn.abbr_booknames,
      strings = defn.strings


// configurations
app.set('view engine', 'ejs')
app.use(express.static('public'))


// get JSON file of bibles
var bible = {}
var footnote = {}
bible['ch'] = JSON.parse(fs.readFileSync('data/bible_chinese_footnote.json', 'utf8'))
bible['en'] = JSON.parse(fs.readFileSync('data/bible_english.json', 'utf8'))
bible['de'] = JSON.parse(fs.readFileSync('data/bible_german.json', 'utf8'))
bible['nfnt'] = {}
bible['nfnt']['ch'] = JSON.parse(fs.readFileSync('data/bible_chinese.json', 'utf8'))
bible['nfnt']['en'] = bible['en']
footnote['ch'] = JSON.parse(fs.readFileSync('data/footnote.json', 'utf8'))


// routing
app.get('/', function(req, res) {
    var lang = req.query.lang
    if (lang === undefined) {
        lang = 'ch'
    }
    res.render('books.ejs', {
        lang: lang,
        booknames: booknames[lang],
        ot_name: testament[lang]['ot'],
        nt_name: testament[lang]['nt']
    })
})

app.get('/chapter', function(req, res) {
    var lang = req.query.lang
    var vlang = req.query.vlang
    var bid = parseInt(req.query.bid)
    var cid = parseInt(req.query.cid)

    // handle undefined variables
    if (lang === undefined) {
        lang = 'ch'
    }
    if (vlang === undefined) {
        vlang = ''
    }
    if (bid === undefined) {
        bid = 1
        cid = 1
    }
    if (cid === undefined) {
        cid = 1
    }

    // check the range of bid
    if (bid < 1 || bid > 66) {
        res.send('bid exceeded the range!')
        return
    }

    // check the range of cid
    var nb_chapters_this_book = nb_chapters[bid-1]
    if (cid < 1 || cid > nb_chapters_this_book) {
        res.send('cid exceeded the range!')
        return
    }

    // check if previous chapter exists
    var prev_url = '/chapter?lang='+lang+'&vlang='+vlang+'&bid='+bid+'&cid='+(cid-1)
    if (cid == 1) {
        prev_url = ''
    }

    // check if next chapter exists
    var next_url = '/chapter?lang='+lang+'&vlang='+vlang+'&bid='+bid+'&cid='+(cid+1)
    if (cid == nb_chapters_this_book) {
        next_url = ''
    }

    // check if vice verses are requested
    var viceverses = null
    if (vlang !== '') {
        viceverses = bible[vlang][bid-1]['chapters'][cid-1]['verses']
    }

    // render views/chapter.ejs
    res.render('chapter.ejs', {
        lang: lang,
        vlang: vlang,
        bookname: booknames[lang][bid-1],
        chaptername: strings[lang]['chapterPrefix'] + cid + strings[lang]['chapterPostfix'],
        verses: bible[lang][bid-1]['chapters'][cid-1]['verses'],
        vverses: viceverses,
        prevChapterURL: prev_url,
        nextChapterURL: next_url
    })
})

app.get('/fnt', function(req, res) {
    var lang = req.query.lang
    var fntIdx = req.query.fntIdx
    res.send(footnote[lang][fntIdx])
})

app.get('/search', function(req, res) {
    var lang = req.query.lang
    var search = req.query.search

    if (search === undefined || search === '') {
        res.render('search.ejs', {lang: lang, results: []})
        return
    }

    var matches = []
    var pos = 0
    var v = ""

    for (var bid = 0; bid < 66; bid++) {
        for (var cid = 0; cid < nb_chapters[bid]; cid++) {
            verses = bible['nfnt'][lang][bid]['chapters'][cid]['verses']
            for (var key in verses) {
                pos = verses[key].indexOf(search)
                if (pos !== -1) {
                    // console.log('%s %d:%s => %s', abbr_booknames['ch'][bid], cid+1, key, verses[key])
                    v = verses[key]
                    v = v.slice(0, pos) + '<u>' + v.slice(pos, pos+search.length) + '</u>' + v.slice(pos+search.length)
                    matches.push({
                        addr: abbr_booknames[lang][bid] + '<br>' + (cid+1) + ':' + key,
                        url: '/chapter?lang='+lang+'&vlang=&bid='+(bid+1)+'&cid='+(cid+1),
                        verse: v
                    })
                }
            }
        }
    }

    res.render('search.ejs', {lang: lang, results: matches})
})


// error handling
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something bad happened!')
})


// start the server
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'
app.listen(port, ip)
console.log('Server running on http://%s:%s', ip, port)
