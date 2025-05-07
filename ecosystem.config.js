module.exports = {
	apps: [
		{
			name: 'kraabmod-backend',
			script: 'dist/server.js',
			instances: 1, // или 'max' для кластерного режима
			exec_mode: 'fork', // можно 'cluster' для балансировки
			watch: false,
			env: {
				NODE_ENV: 'production',
				PORT: 3001,
			},
		},
	],
}
