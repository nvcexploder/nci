'use strict';

var spawn = require('child_process').spawn,
	ParentCommand = require('./base').Command,
	inherits = require('util').inherits;

function Command(params) {
	params = params || {};
	ParentCommand.call(this, params);
	this.cwd = params.cwd;
}

exports.Command = Command;

inherits(Command, ParentCommand);

/**
 * Executes `params.cmd` with `params.args` and `params.options`
 */
Command.prototype.run = function(params, callback) {
	var self = this,
		stdout = '';
	if (!params.cmd) return callback(new Error('`cmd` is not set'));
	if (!params.args) return callback(new Error('`args` is not set'));
	params.options = params.options || {};
	params.options.cwd = params.options.cwd || this.cwd;
	var cmd = spawn(params.cmd, params.args, params.options);
	cmd.stdout.on('data', function(data) {
		if (self.isEmit) self.emit('stdout', data);
		// TODO: join stdout only if flag is set
		stdout += data;
	});
	cmd.stderr.on('data', function(data) {
		callback(new Error('Scm outputs to stderr: ' + data));
		cmd.kill();
	});
	cmd.on('exit', function(code) {
		if (code !== 0) callback(new Error(
			'Spawned command exits with non-zero code: ' + code
		));
	});
	// TODO; callback should be called only once (port once from underscore)
	cmd.on('close', function() {
		callback(null, stdout);
	});
	return cmd;
};