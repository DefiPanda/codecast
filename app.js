var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    sys = require('sys'),
    exec = require('child_process').exec,
    server;

server = http.createServer(function (req, res) {
    var path = url.parse(req.url).pathname;

    switch (path) {

    case '/':
        if (req.method == 'POST') {
            req.on('data', function (chunk) {
                var split = chunk.toString().split('&');
                var code = decodeURIComponent(split[0].split('=')[1].replace(/\+/g, " "));
                var language = split[1].split('=')[1];
                var filename = __dirname;

                if (language != 'java') {
                    filename = generateFileName(__dirname + '/tmp/', language);
                } else {
                    var tmp_arr = code.substring(0, code.indexOf('{')).replace(/(^\s*)|(\s*$)/g, "").split(" ");
                    var tmp_name = tmp_arr[tmp_arr.length - 1];
                    filename = tmp_name + '.java';
                }

                fs.writeFile(filename, code, function (error) {
                    if (error) {
                        res.writeHead(200, {
                            'Content-Type': 'text/html'
                        });
                        res.write(error + '', 'utf8');
                        res.end();
                    }
                });

                var command = "";

                switch (language) {
                case 'c':
                    var compiled = filename.split('.c')[0];
                    console.log(compiled);
                    command = "gcc " + filename + ' -o ' + compiled + ' && ' + compiled + ' && rm ' + compiled;
                    console.log(command);
                    break;
                case 'js':
                    command = "node " + filename;
                    break;
                case 'rb':
                    command = "ruby " + filename;
                    break;
                case 'py':
                    command = "python " + filename;
                    break;
                case 'java':
                    var compiled = filename.split('.java')[0];
                    command = "javac " + filename + '&& java ' + compiled + '&& rm ' + compiled + '.class';
                    break;
                }

                command = command + ' && rm ' + filename;


                var status = exec(command, function (error, stdout, stderr) {
                    var writeback = stdout;
                    if (error !== null) {
                        writeback = 'exec error: ' + error;
                    }
                    res.writeHead(200, {
                        'Content-Type': 'text/html'
                    });
                    res.write(writeback, 'utf8');
                    res.end();
                });


            });
        } else {
            fs.readFile(__dirname + '/index.html', function (err, data) {
                if (err) return send404(res);
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });
                res.write(data, 'utf8');
                res.end();
            });
        }

        break;

    default:
        send404(res);
    }
}),

send404 = function (res) {
    res.writeHead(404);
    res.write('404');
    res.end();
};

generateFileName = function (prefix, postfix) {
    var seed = Math.floor(Math.random() * 900000) + 100000;
    return prefix + seed + '.' + postfix;
}

server.listen(process.env.PORT || 5000);
