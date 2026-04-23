<script lang="ts">
	import { goto } from '$app/navigation';
	import { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple, currentUser } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let mode = $state<'login' | 'signup'>('login');
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let errorMsg = $state('');
	let loading = $state(false);

	onMount(() => {
		const unsub = currentUser.subscribe((u) => {
			if (u) goto('/');
		});
		return unsub;
	});

	async function handleSubmit() {
		if (!email || !password) return;
		loading = true;
		errorMsg = '';

		const error = mode === 'login'
			? await signInWithEmail(email, password)
			: await signUpWithEmail(email, password);

		loading = false;
		if (error) {
			errorMsg = translateError(error.message);
		} else if (mode === 'signup') {
			errorMsg = '';
			mode = 'login';
			email = '';
			password = '';
			errorMsg = 'Account creato! Controlla la tua email per confermare, poi accedi.';
		}
	}

	function translateError(msg: string): string {
		if (msg.includes('Invalid login credentials')) return 'Email o password errati.';
		if (msg.includes('Email not confirmed')) return 'Conferma la tua email prima di accedere.';
		if (msg.includes('User already registered')) return 'Esiste già un account con questa email.';
		if (msg.includes('Password should be')) return 'La password deve essere di almeno 6 caratteri.';
		return msg;
	}

	async function handleGoogle() {
		loading = true;
		errorMsg = '';
		const error = await signInWithGoogle();
		if (error) { errorMsg = error.message; loading = false; }
	}

	async function handleApple() {
		loading = true;
		errorMsg = '';
		const error = await signInWithApple();
		if (error) { errorMsg = error.message; loading = false; }
	}
</script>

<svelte:head>
	<title>Appare — Accedi</title>
</svelte:head>

<div class="login-page">
	<div class="login-card">
		<!-- Logo -->
		<div class="logo">
			<span class="logo-jp">日本語</span>
			<span class="logo-title">Appare</span>
		</div>

		<h1 class="heading">{mode === 'login' ? 'Bentornato' : 'Crea account'}</h1>
		<p class="subheading">{mode === 'login' ? 'Accedi per continuare a studiare.' : 'Inizia il tuo percorso con il giapponese.'}</p>

		<!-- OAuth buttons -->
		<div class="oauth-group">
			<button class="oauth-btn" onclick={handleGoogle} disabled={loading}>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
					<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
					<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
					<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
					<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
				</svg>
				Continua con Google
			</button>

			<button class="oauth-btn" onclick={handleApple} disabled={loading}>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
					<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
				</svg>
				Continua con Apple
			</button>
		</div>

		<div class="divider"><span>oppure</span></div>

		<!-- Email/password form -->
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="field">
				<label class="label" for="email">Email</label>
				<input
					id="email"
					class="input"
					type="email"
					bind:value={email}
					placeholder="tua@email.com"
					autocomplete="email"
					disabled={loading}
				/>
			</div>
			<div class="field">
				<label class="label" for="password">Password</label>
				<div class="password-wrapper">
					<input
						id="password"
						class="input password-input"
						type={showPassword ? 'text' : 'password'}
						bind:value={password}
						placeholder="••••••••"
						autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
						disabled={loading}
					/>
					<button type="button" class="eye-btn" onclick={() => showPassword = !showPassword} tabindex="-1" aria-label="Mostra password">
						{#if showPassword}
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
						{:else}
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
						{/if}
					</button>
				</div>
			</div>

			{#if errorMsg}
				<p class="error-msg" class:success={errorMsg.includes('creato')}>{errorMsg}</p>
			{/if}

			<button class="submit-btn" type="submit" disabled={loading || !email || !password}>
				{loading ? 'Caricamento...' : mode === 'login' ? 'Accedi' : 'Crea account'}
			</button>
		</form>

		<button class="switch-btn" onclick={() => { mode = mode === 'login' ? 'signup' : 'login'; errorMsg = ''; }} disabled={loading}>
			{mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
		</button>
	</div>
</div>

<style>
	.login-page {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background-color: var(--color-bg);
	}

	.login-card {
		width: 100%;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.logo {
		display: flex;
		flex-direction: column;
		margin-bottom: 2rem;
	}

	.logo-jp {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		letter-spacing: 0.02em;
		font-family: var(--font-jp);
	}

	.logo-title {
		font-size: 2rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		color: var(--color-primary);
		line-height: 1;
	}

	.heading {
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0 0 0.25rem 0;
	}

	.subheading {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		margin: 0 0 1.75rem 0;
	}

	.oauth-group {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		margin-bottom: 1.25rem;
	}

	.oauth-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.8rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		font-size: 0.95rem;
		font-weight: 600;
		font-family: var(--font-sans);
		color: var(--color-text);
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.oauth-btn:hover:not(:disabled) {
		background: var(--color-surface-warm);
	}

	.oauth-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
		color: var(--color-text-tertiary);
		font-size: 0.8rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--color-border);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 1rem;
	}

	.label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.input {
		width: 100%;
		padding: 0.8rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		font-size: 1rem;
		font-family: var(--font-sans);
		background: var(--color-bg);
		color: var(--color-text);
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.15s ease;
	}

	.input:focus {
		border-color: var(--color-primary);
	}

	.input:disabled {
		opacity: 0.5;
	}

	.password-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.password-input {
		padding-right: 3rem;
	}

	.eye-btn {
		position: absolute;
		right: 0.75rem;
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		color: var(--color-text-secondary);
		display: flex;
		align-items: center;
		border-radius: var(--radius-sm);
	}

	.error-msg {
		font-size: 0.85rem;
		color: #C5221F;
		margin: 0 0 0.75rem 0;
		padding: 0.65rem 0.85rem;
		background: #FCE8E6;
		border-radius: var(--radius-md);
	}

	.error-msg.success {
		color: #137333;
		background: #E6F4EA;
	}

	.submit-btn {
		width: 100%;
		padding: 0.95rem;
		background-color: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-lg);
		font-size: 1rem;
		font-weight: 700;
		font-family: var(--font-sans);
		cursor: pointer;
		transition: background-color 0.15s ease;
		margin-bottom: 1rem;
	}

	.submit-btn:hover:not(:disabled) {
		background-color: var(--color-primary-light);
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.switch-btn {
		background: none;
		border: none;
		font-family: var(--font-sans);
		font-size: 0.875rem;
		color: var(--color-primary);
		cursor: pointer;
		text-align: center;
		font-weight: 600;
		padding: 0.25rem;
	}

	.switch-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
