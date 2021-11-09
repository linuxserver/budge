<script>
	import Dialog, { Title, Content, Actions } from '@smui/dialog';
	import Button, { Label } from '@smui/button';

	import Textfield from '@smui/textfield';
	import Icon from '@smui/textfield/icon';
	import HelperText from '@smui/textfield/helper-text/index';

	import { createEventDispatcher } from 'svelte';
	import api from '../../api';

	export let open;

	let focused = false;
	let name = null;
	let nameInvalid = false;

	const dispatch = createEventDispatcher();
	async function submit() {
		await api.createBudget(name);
		dispatch('createBuget');
	}
</script>

<Dialog
	bind:open
	aria-labelledby="simple-title"
	aria-describedby="simple-content"
	scrimClickAction=""
	escapeKeyAction=""
    on:MDCDialog:closed={submit}
>
	<!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
	<Title id="simple-title">Login</Title>
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
