<script lang="ts">
	import { enhance } from '$app/forms';

	export let data;
</script>

<div>
	<h1>Login</h1>

	<form method="POST" action="?&redirect_to={data.redirectTo ?? ''}" use:enhance>
		<label>
			Username
			<input name="username" required />
		</label>
		<label>
			Password
			<input type="password" name="password" required />
		</label>

		<button type="submit">Login</button>
	</form>
</div>
