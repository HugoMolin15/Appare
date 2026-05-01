<script lang="ts">
	import { goto } from '$app/navigation';
	import { signInWithEmail, signUpWithEmail, currentUser } from '$lib/stores/auth';
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

</script>

<svelte:head>
	<title>Anki-jin — Accedi</title>
</svelte:head>

<div class="login-page">
	<div class="login-card">
		<!-- Logo -->
		<div class="logo">
			<span class="logo-jp">日本語</span>
			<span class="logo-title">Anki-jin</span>
		</div>

		<h1 class="heading">{mode === 'login' ? 'Bentornato' : 'Crea account'}</h1>
		<p class="subheading">{mode === 'login' ? 'Accedi per continuare a studiare.' : 'Inizia il tuo percorso con il giapponese.'}</p>

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
		border-color: #e0dce6;
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
