package com.example.roadmaintenance.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final TokenService tokenService;

    public AuthInterceptor(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // Extract Bearer token if not already set by JwtAuthenticationFilter
        String authHeader = request.getHeader("Authorization");
        if (UserContext.get() == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            AuthenticatedUser user = tokenService.parseAndValidateToken(token);
            if (user != null) {
                UserContext.set(user);
            }
        }

        if (handler instanceof HandlerMethod handlerMethod) {
            RequireRole requireRole = handlerMethod.getMethodAnnotation(RequireRole.class);
            if (requireRole == null) {
                requireRole = handlerMethod.getBeanType().getAnnotation(RequireRole.class);
            }

            if (requireRole != null) {
                AuthenticatedUser currentUser = UserContext.get();
                if (currentUser == null) {
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required to access this resource.");
                }

                boolean hasRole = Arrays.stream(requireRole.value()).anyMatch(required -> matchesRole(required, currentUser.role()));
                if (!hasRole) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. Role " + currentUser.role() + " is not authorized for this operation.");
                }
            }
        }

        return true;
    }

    private boolean matchesRole(UserRole required, UserRole actual) {
        if (required == actual) return true;
        // ADMIN has superuser privileges across system actions
        if (actual == UserRole.ADMIN) return true;
        // WORKER and MAINTENANCE_STAFF are synonyms
        if ((required == UserRole.WORKER || required == UserRole.MAINTENANCE_STAFF) &&
            (actual == UserRole.WORKER || actual == UserRole.MAINTENANCE_STAFF)) {
            return true;
        }
        // PUBLIC and VIEWER are synonyms
        if ((required == UserRole.PUBLIC || required == UserRole.VIEWER) &&
            (actual == UserRole.PUBLIC || actual == UserRole.VIEWER)) {
            return true;
        }
        return false;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
