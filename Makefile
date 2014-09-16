test:
	@node node_modules/lab/bin/lab
test-cov:
	@node node_modules/lab/bin/lab -t 100
test-lcov:
	@node node_modules/lab/bin/lab -t 90 -r lcov | ./node_modules/coveralls/bin/coveralls.js
test-cov-html:
	@node node_modules/lab/bin/lab -r html -o coverage.html
.PHONY: test test-cov test-cov-html
