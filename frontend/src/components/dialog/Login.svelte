<script>
	import Dialog, { Title, Content, Actions } from '@smui/dialog';
	import Button, { Label } from '@smui/button';

	import Textfield from '@smui/textfield';
	import Icon from '@smui/textfield/icon';
	import HelperText from '@smui/textfield/helper-text/index';

	import { createEventDispatcher } from 'svelte';

	export let open;

	let focused = false;
	let email = null;
	let emailInvalid = false;
	let password = null;
	let passwordInvalid = false;

	const dispatch = createEventDispatcher();
	function submit() {
		dispatch('login', {
			email,
			password
		});
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
			type="email"
			bind:invalid={emailInvalid}
			updateInvalid
			bind:value={email}
			label="Email"
			style="min-width: 250px;"
			input$autocomplete="email"
			on:focus={() => (focused = true)}
			on:blur={() => (focused = false)}
		>
			<!--
          Since this icon is conditional, it needs to be wrapped
          in a fragment, and we need to provide withTrailingIcon.
        -->
			<HelperText validationMsg slot="helper">That's not a valid email address.</HelperText>
		</Textfield>
		<Textfield
			type="password"
			bind:passwordInvalid
			updateInvalid
			bind:value={password}
			label="Password"
			style="min-width: 250px;"
			input$autocomplete="password"
			on:focus={() => (focused = true)}
			on:blur={() => (focused = false)}
		/>
	</Content>
	<Actions>
		<!--
      Since this icon is conditional, it needs to be wrapped
      in a fragment, and we need to provide withTrailingIcon.
    -->
		<Button action="login">
			<Label>Login</Label>
		</Button>
	</Actions>
</Dialog>
