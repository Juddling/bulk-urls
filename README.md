## Bulk URL Checker
Make a file with one URL per line, and then run:

```sh
cat urls.txt | bulk-urls
```

This will flag any URL which isn't returning a 200 code.

## Features
* ⚡️ Runs checks in parallel
* 🔒 Supports checking URLs behind basic authentication
* 🗄 Groups results by response type

## Install
With yarn:
```
yarn global add @juddling/bulk-urls
```

With npm:
```
npm i --global @juddling/bulk-urls
```

## Config
You can optionally pass a JSON config file:

```sh
cat urls.txt | bulk-urls --config ~/bulk-url-config.json
```

Example:

```json
{
    "headers": {
        // echo "user:pass" | base64
        "Authorization": "Basic dXNlcjpwYXNzCg=="
    }
}
```