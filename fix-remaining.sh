#!/bin/bash

# Fix catch blocks with unused error variable
sed -i 's/} catch (e) {/} catch {/g' src/app/api/publishing/generate-book-outline/route.ts
sed -i 's/} catch (e) {/} catch {/g' src/app/api/publishing/generate-paper/route.ts
sed -i 's/} catch (e) {/} catch {/g' src/app/api/publishing/generate-presentation/route.ts
sed -i 's/} catch (e) {/} catch {/g' src/app/api/qa/ask/route.ts
sed -i 's/} catch (error) {/} catch {/g' src/app/api/research-assistant/chat/route.ts

echo "Fixed catch blocks"
