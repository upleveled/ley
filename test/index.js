const { test } = require('uvu');
const assert = require('uvu/assert');
const fs = require('fs');
const { join } = require('path');
const ley = require('..');
const $ = require('../lib/util');

test('exports', () => {
	assert.type(ley, 'object');
	assert.type(ley.up, 'function');
	assert.type(ley.down, 'function');
	assert.type(ley.status, 'function');
	assert.type(ley.new, 'function');
});

test('new :: defaults to ESM .ts', async () => {
	const cwd = fs.mkdtempSync(join(__dirname, '.tmp-ley-new-default-'));
	const migrations = join(cwd, 'migrations');
	fs.mkdirSync(migrations);
	fs.writeFileSync(join(migrations, '00001-first.js'), 'export async function up() {}\n');

	const oldDetect = $.detect;
	try {
		$.detect = () => 'pg';

		const output = await ley.new({ cwd, dir: 'migrations', filename: 'users', length: 5, driver: 'pg' });
		assert.is(output, '00002-users.ts');

		const body = fs.readFileSync(join(migrations, output), 'utf8');
		assert.is(body, 'export async function up(client) {\n\n}\n\nexport async function down(client) {\n\n}\n');
	} finally {
		$.detect = oldDetect;
		fs.rmSync(cwd, { recursive: true, force: true });
	}
});

test('new :: postgres template uses Sql type', async () => {
	const cwd = fs.mkdtempSync(join(__dirname, '.tmp-ley-new-postgres-'));
	const migrations = join(cwd, 'migrations');
	fs.mkdirSync(migrations);
	fs.writeFileSync(join(migrations, '00001-first.js'), 'export async function up() {}\n');

	const oldDetect = $.detect;
	try {
		$.detect = () => 'postgres';

		const output = await ley.new({ cwd, dir: 'migrations', filename: 'todos', length: 5, driver: 'postgres' });
		assert.is(output, '00002-todos.ts');

		const body = fs.readFileSync(join(migrations, output), 'utf8');
		assert.is(
			body,
			"import type { Sql } from 'postgres';\n\nexport async function up(sql: Sql) {}\n\nexport async function down(sql: Sql) {}\n"
		);
	} finally {
		$.detect = oldDetect;
		fs.rmSync(cwd, { recursive: true, force: true });
	}
});

test.run();
