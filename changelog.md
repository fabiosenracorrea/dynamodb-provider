# DynamoDB Provider Changelog

## v0.0.5

- `blockInternalPropUpdate` configuration added to SingleTable. now by default, any update that references any internal table prop will throw. You can disable this behavior and use the `badUpdateValidation` to only block the ones you want

## v0.0.4

- some Collection, FromEntity and FromCollection types exposed

## v0.0.1

- Early release
- Documentation Incomplete

Expect a lot of updates while we push to v1.0.0 and reach stability and follow SEMVER properly.

Usage in production before than is not recommended
