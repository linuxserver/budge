<script>
	import Drawer, { Content, Header, Subtitle } from '@smui/drawer';
	import List, { Item, Separator, Subheader, Text } from '@smui/list';
	import TopAppBar, { Title } from '@smui/top-app-bar';
	import { activeBudget } from '../stores/budgets';
	import Menu from '@smui/menu';
	import { token } from '../stores/users';
    import Button, { Label } from '@smui/button';
    import { H6 } from '@smui/common/elements';
	import { createEventDispatcher } from 'svelte';
    import { goto } from '$app/navigation';

	import api from '../api';

	let menu;

	export let open;
	let active = 'Gray Kittens';

	function setActive(label) {
		active = label;
	}

    const dispatch = createEventDispatcher();
    function openCreateAccount() {
        dispatch('createAccount')
    }
</script>

<Drawer variant="dismissible" bind:open fixed={false}>
	<Header>
		<Title on:click={() => menu.setOpen(true)}>{$activeBudget.name || ''}</Title>
		<!-- <Subtitle>It's the best drawer.</Subtitle> -->
		<Menu bind:this={menu}>
			<List>
				<Separator />
				<Item on:SMUI:action={api.logout}>
					<Text>Logout</Text>
				</Item>
			</List>
		</Menu>
	</Header>
	<Content>
		<List>
            <Item
                href="javascript:void(0)"
                on:click={() => setActive('budget')}
                activated={active === 'budget'}
            >
                <Text>Budget</Text>
            </Item>
            <Separator />
            <Subheader component={H6}>Accounts</Subheader>
            {#if $activeBudget.accounts}
                {#each $activeBudget.accounts as account}
                    <Item
                        href="javascript:void(0)"
                        on:click={() => goto('/accounts')}
                        activated={active === `account-${account.id}`}
                    >
                        <Text>{account.name}</Text>
                    </Item>
                {/each}
            {/if}
            <!-- <Item> -->
                <Button color="secondary" variant="unelevated" on:click={() => openCreateAccount()}>
                    <Label>Add Account</Label>
                </Button>
            <!-- </Item> -->
		</List>
	</Content>
</Drawer>
