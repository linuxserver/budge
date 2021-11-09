<script>
	import Dialog, { Title, Content, Actions } from '@smui/dialog';
	import Button, { Label } from '@smui/button';

	import Textfield from '@smui/textfield';
	import Icon from '@smui/textfield/icon';
	import HelperText from '@smui/textfield/helper-text/index';

	import { createEventDispatcher } from 'svelte';
	import api from '../../api';
	import { activeBudget } from '../../stores/budgets';
    import Select, { Option } from '@smui/select';

	export let open;

	let focused = false;
	let name = null;
    let type = null;
	let nameInvalid = false;

	const accountTypes = ['Bank', 'Credit Card'];

	const dispatch = createEventDispatcher();
	async function submit() {
		await api.createAccount(name, type, $activeBudget.id);
		dispatch('createBuget');
	}
</script>

<Dialog
	bind:open
	aria-labelledby="simple-title"
	aria-describedby="simple-content"
>
	<!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
	<Title id="simple-title">Create New Account</Title>
	<Content id="simple-content">
		<Textfield
			type="name"
			bind:invalid={nameInvalid}
			updateInvalid
			bind:value={name}
			label="Budget Name"
			style="min-width: 250px;"
			on:focus={() => (focused = true)}
			on:blur={() => (focused = false)}
		/>
		<Select bind:value={type} label="Account Type">
			{#each accountTypes as type, i}
				<Option value={i}>{type}</Option>
			{/each}
		</Select>
	</Content>
	<Actions>
		<!--
      Since this icon is conditional, it needs to be wrapped
      in a fragment, and we need to provide withTrailingIcon.
    -->
		<Button action="createBuget">
			<Label>Create</Label>
		</Button>
	</Actions>
</Dialog>
