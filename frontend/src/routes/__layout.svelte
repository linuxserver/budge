<script lang="ts">
	import TopAppBar, {
		Row,
		Section,
		Title,
		AutoAdjust,
		TopAppBarComponentDev
	} from '@smui/top-app-bar';
	import { AppContent } from '@smui/drawer';
	import IconButton from '@smui/icon-button';
	import Drawer from '../components/Drawer.svelte';
	import { onMount } from 'svelte';
	import api from '../api';
	import { user } from '../stores/users';
	import Login from '../components/dialog/Login.svelte';
	import CreateBudget from '../components/dialog/CreateBudget.svelte'
	import { budgets, activeBudget } from '../stores/budgets';
	import CreateAccount from '../components/dialog/CreateAccount.svelte';

	let loginDialogOpen = false;
	let createBudgetDialoagOpen = false;
	let createAccountDialoagOpen = false;

	onMount(async () => {
		await api.ping();
		if (!$user) {
			return (loginDialogOpen = true);
		}

		initUser();
	});

	async function initUser() {
		// Dispatch everything for initial user info
		await Promise.all([
			api.getBudgets(),
		])

		switch ($budgets.length) {
			case 0:
				return createBudgetDialoagOpen = true;
			case 1:
			default:
				// @TODO: have a default budget item?
				activeBudget.set($budgets[0])
		}

		drawerOpen = true;
	}

	let topAppBar: TopAppBarComponentDev;
	let drawerOpen = false;

	// let lightTheme =
	// 	typeof window === 'undefined' || window.matchMedia('(prefers-color-scheme: light)').matches;
	let lightTheme = false;
	function switchTheme() {
		lightTheme = !lightTheme;
		let themeLink = document.head.querySelector<HTMLLinkElement>('#theme');
		if (!themeLink) {
			themeLink = document.createElement('link');
			themeLink.rel = 'stylesheet';
			themeLink.id = 'theme';
		}
		themeLink.href = `/smui${lightTheme ? '' : '-dark'}.css`;
		document.head
			.querySelector<HTMLLinkElement>('link[href="/smui-dark.css"]')
			?.insertAdjacentElement('afterend', themeLink);
	}

	async function login(event) {
		console.log(event);
		const loggedIn = await api.login(event.detail.email, event.detail.password);
		if (!loggedIn) {
			return (loginDialogOpen = true);
		}

		initUser();
	}

	async function startCreateAccount() {
		createAccountDialoagOpen = true;
	}
</script>

<div style="display: flex; justify-content: space-between;">
	<Login on:login={login} bind:open={loginDialogOpen} />
	<CreateBudget on:createBudget={initUser} bind:open={createBudgetDialoagOpen} />
	<CreateAccount on:createAccount={initUser} bind:open={createAccountDialoagOpen} />

	<TopAppBar bind:this={topAppBar} variant="fixed" color="secondary">
		<Row>
			<Section>
				<IconButton class="material-icons" on:click={() => (drawerOpen = !drawerOpen)}
					>menu</IconButton
				>
				<Title>WeNAB</Title>
			</Section>
			<Section align="end" toolbar>
				<IconButton class="material-icons" aria-label="Change Theme" on:click={switchTheme}
					>light_bulb</IconButton
				>
			</Section>
		</Row>
	</TopAppBar>
	<AutoAdjust {topAppBar}>
		<div class="drawer-container">
			<Drawer bind:open={drawerOpen} on:createAccount={startCreateAccount}/>
			<AppContent class="app-content">
				<main class="main-content">
					<div class="container"><slot /></div>
				</main>
			</AppContent>
		</div>
	</AutoAdjust>
</div>

<style>
	.drawer-container {
		z-index: 0;
	}
</style>
