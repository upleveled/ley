const { test } = require('uvu');
const assert = require('uvu/assert');
const fs = require('fs');
const { join } = require('path');
const ley = require('..');

test('exports', () => {
	assert.type(ley, 'object');
	assert.type(ley.up, 'function');
	assert.type(ley.down, 'function');
	assert.type(ley.status, 'function');
	assert.type(ley.new, 'function');
});

test('new :: postgres template uses Sql type', async () => {
	const cwd = fs.mkdtempSync(join(__dirname, '.tmp-ley-new-postgres-'));
	const migrations = join(cwd, 'migrations');
	fs.mkdirSync(migrations);
	fs.writeFileSync(join(migrations, '00001-first.ts'), 'export async function up() {}\n');

	try {
		const output = await ley.new({ cwd, dir: 'migrations', filename: 'todos', length: 5, driver: 'postgres' });
		assert.is(output, '00002-todos.ts');

		const body = fs.readFileSync(join(migrations, output), 'utf8');
		assert.is(
			body,
			"import type { Sql } from 'postgres';\n\nexport async function up(sql: Sql) {\n\n}\n\nexport async function down(sql: Sql) {\n\n}\n"
		);
	} finally {
		fs.rmSync(cwd, { recursive: true, force: true });
	}
});

test('new :: rejects non-TypeScript extension', async () => {
	const cwd = fs.mkdtempSync(join(__dirname, '.tmp-ley-new-invalid-ext-'));
	const migrations = join(cwd, 'migrations');
	fs.mkdirSync(migrations);
	fs.writeFileSync(join(migrations, '00001-first.ts'), 'export async function up() {}\n');

	try {
		let caught = false;
		try {
			await ley.new({ cwd, dir: 'migrations', filename: 'todos.js', length: 5, driver: 'postgres' });
			assert.unreachable();
		} catch (err) {
			caught = true;
			assert.match(err.message, /New migration files must use a TypeScript extension/);
		}
		assert.ok(caught);
	} finally {
		fs.rmSync(cwd, { recursive: true, force: true });
	}
});

test('new :: prefers explicit driver over autodetection for template', async () => {
	const cwd = fs.mkdtempSync(join(__dirname, '.tmp-ley-new-driver-priority-'));
	const migrations = join(cwd, 'migrations');
	fs.mkdirSync(migrations);
	fs.writeFileSync(join(migrations, '00001-first.ts'), 'export async function up() {}\n');
	fs.writeFileSync(
		join(cwd, 'package.json'),
		JSON.stringify({ name: 'tmp', private: true, dependencies: { postgres: '^3.0.0', pg: '^8.0.0' } }, null, 2)
	);

	try {
		const output = await ley.new({ cwd, dir: 'migrations', filename: 'users', length: 5, driver: 'pg' });
		assert.is(output, '00002-users.ts');

		const body = fs.readFileSync(join(migrations, output), 'utf8');
		assert.is(body, 'export async function up(client) {\n\n}\n\nexport async function down(client) {\n\n}\n');
	} finally {
		fs.rmSync(cwd, { recursive: true, force: true });
	}
});

test.run();
