package com.example.roadmaintenance.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final TokenService tokenService;

    public JwtAuthenticationFilter(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        AuthenticatedUser user = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            user = tokenService.parseAndValidateToken(token);
        }

        if (user != null) {
            UserContext.set(user);

            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.role().name()));

            // Also add alias authority for backward-compatible role checks
            if (user.role() == UserRole.WORKER) {
                authorities.add(new SimpleGrantedAuthority("ROLE_MAINTENANCE_STAFF"));
            } else if (user.role() == UserRole.MAINTENANCE_STAFF) {
                authorities.add(new SimpleGrantedAuthority("ROLE_WORKER"));
            } else if (user.role() == UserRole.PUBLIC) {
                authorities.add(new SimpleGrantedAuthority("ROLE_VIEWER"));
            } else if (user.role() == UserRole.VIEWER) {
                authorities.add(new SimpleGrantedAuthority("ROLE_PUBLIC"));
            }

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    user,
                    null,
                    authorities
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContext.clear();
        }
    }
}

